'use strict';

const express = require('express');
const db = require('../db');
const { recomputeStoreMetrics, recomputeGlobalMetrics } = require('../lib/datasetAnalytics');
const { toCsvLine, sanitizeFilename } = require('../lib/csvSafe');

const router = express.Router();
const raw = (text, params) => db.pool.query(text, params);

const SORT_FIELDS = new Set([
  'product_name', 'category', 'stock', 'reorder_level', 'reorder_quantity',
  'unit_price', 'unit_cost', 'units_sold', 'expiry_date', 'received_date', 'created_at', 'id',
]);

function parseId(rawId) {
  if (!/^\d+$/.test(String(rawId))) return { error: 400 };
  const id = parseInt(rawId, 10);
  if (id <= 0 || id > 999999999) return { error: 400 };
  return { id };
}

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

async function getStore(id) {
  const r = await raw('SELECT * FROM dataset.stores WHERE id=$1', [id]);
  return r.rows[0] || null;
}

async function recompute(storeId) {
  try {
    await recomputeStoreMetrics(storeId);
    await recomputeGlobalMetrics();
  } catch (e) {
    console.error('[stores] metrics recompute failed', { store_id: storeId });
  }
}

// ── Stores CRUD ──
router.get('/', async (req, res) => {
  try {
    const r = await raw('SELECT * FROM dataset.stores ORDER BY name');
    res.json(r.rows);
  } catch (e) {
    console.error('[stores] error');
    fail(res, 500, 'Internal server error');
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, city, lead_time_days, safety_days } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return fail(res, 400, 'name is required');
    }
    const lead = lead_time_days != null ? parseInt(lead_time_days, 10) : 3;
    const safety = safety_days != null ? parseInt(safety_days, 10) : 2;
    if (!Number.isFinite(lead) || lead < 0 || !Number.isFinite(safety) || safety < 0) {
      return fail(res, 400, 'Invalid lead_time_days or safety_days');
    }
    const r = await raw(
      'INSERT INTO dataset.stores (name, city, lead_time_days, safety_days) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim().slice(0, 120), city ? String(city).slice(0, 120) : null, lead, safety]
    );
    await recompute(r.rows[0].id);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err && err.code === '23505') return fail(res, 409, 'Store name already exists');
    console.error('[stores] create error');
    fail(res, 500, 'Internal server error');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    res.json(s);
  } catch (e) {
    console.error('[stores/:id] error');
    fail(res, 500, 'Internal server error');
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    const b = req.body || {};
    const name = b.name !== undefined ? String(b.name).trim().slice(0, 120) : s.name;
    if (!name) return fail(res, 400, 'name cannot be empty');
    const city = b.city !== undefined ? (b.city ? String(b.city).slice(0, 120) : null) : s.city;
    let lead = s.lead_time_days;
    let safety = s.safety_days;
    if (b.lead_time_days !== undefined) {
      lead = parseInt(b.lead_time_days, 10);
      if (!Number.isFinite(lead) || lead < 0) return fail(res, 400, 'Invalid lead_time_days');
    }
    if (b.safety_days !== undefined) {
      safety = parseInt(b.safety_days, 10);
      if (!Number.isFinite(safety) || safety < 0) return fail(res, 400, 'Invalid safety_days');
    }
    let active = s.active_upload_id;
    if (b.active_upload_id !== undefined) {
      if (b.active_upload_id === null) {
        active = null;
      } else {
        const a = parseInt(b.active_upload_id, 10);
        if (!Number.isFinite(a)) return fail(res, 400, 'Invalid active_upload_id');
        const up = await raw('SELECT id FROM dataset.uploads WHERE id=$1 AND store_id=$2', [a, p.id]);
        if (!up.rows.length) return fail(res, 404, 'Upload not found for this store');
        active = a;
      }
    }
    const r = await raw(
      `UPDATE dataset.stores SET name=$1, city=$2, lead_time_days=$3, safety_days=$4, active_upload_id=$5
       WHERE id=$6 RETURNING *`,
      [name, city, lead, safety, active, p.id]
    );
    await recompute(p.id);
    res.json(r.rows[0]);
  } catch (err) {
    if (err && err.code === '23505') return fail(res, 409, 'Store name already exists');
    console.error('[stores/:id] patch error');
    fail(res, 500, 'Internal server error');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    if (req.query.confirm !== 'true') {
      return fail(res, 400, 'Confirmation required (confirm=true)');
    }
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    await raw('DELETE FROM dataset.stores WHERE id=$1', [p.id]);
    try { await recomputeGlobalMetrics(); } catch (e) {
      console.error('[stores] global recompute failed after delete', { store_id: p.id });
    }
    console.log('[stores/delete]', { store_id: p.id });
    res.json({ deleted: true, id: p.id });
  } catch (e) {
    console.error('[stores/delete] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Items (merged dataset records + manual items) ──
router.get('/:id/items', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');

    let page = parseInt(req.query.page || '1', 10);
    let pageSize = parseInt(req.query.page_size || '50', 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 50;
    if (pageSize > 200) pageSize = 200;
    const search = req.query.search ? String(req.query.search).trim().slice(0, 200) : null;
    const sort = SORT_FIELDS.has(req.query.sort) ? req.query.sort : 'product_name';
    const dir = String(req.query.dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * pageSize;

    // manual items
    const manParams = [p.id];
    let manWhere = 'store_id=$1';
    if (search) {
      manParams.push(`%${search}%`);
      manWhere += ` AND product_name ILIKE $${manParams.length}`;
    }
    manParams.push(pageSize, offset);
    const manRes = await raw(
      `SELECT id, product_name, category, stock, reorder_level, reorder_quantity, unit_price, unit_cost,
              units_sold, expiry_date, received_date, created_at, updated_at, 'manual' AS source
       FROM dataset.manual_items WHERE ${manWhere}
       ORDER BY ${sort} ${dir} LIMIT $${manParams.length - 1} OFFSET $${manParams.length}`,
      manParams
    );
    const manCountRes = await raw(
      `SELECT COUNT(*)::int AS n FROM dataset.manual_items WHERE ${manWhere.replace(/ LIMIT.*/, '')}`,
      manParams.slice(0, manParams.length - 2)
    );
    const manualTotal = manCountRes.rows[0].n;

    // dataset records (active upload)
    let datasetRows = [];
    let datasetTotal = 0;
    if (s.active_upload_id) {
      const dsParams = [s.active_upload_id];
      let dsWhere = 'upload_id=$1';
      if (search) {
        dsParams.push(`%${search}%`);
        dsWhere += ` AND parsed->>'product_name' ILIKE $${dsParams.length}`;
      }
      let dsOrder;
      if (['stock', 'reorder_level', 'reorder_quantity', 'unit_price', 'unit_cost', 'units_sold'].includes(sort)) {
        dsOrder = `(parsed->>'${sort}')::numeric ${dir}`;
      } else if (sort === 'product_name' || sort === 'category' || sort === 'expiry_date' || sort === 'received_date') {
        dsOrder = `parsed->>'${sort}' ${dir}`;
      } else {
        dsOrder = `row_number ${dir}`;
      }
      const dsRes = await raw(
        `SELECT id, row_number, parsed, issues FROM dataset.records WHERE ${dsWhere}
         ORDER BY ${dsOrder} NULLS LAST LIMIT $${dsParams.length + 1} OFFSET $${dsParams.length + 2}`,
        [...dsParams, pageSize, offset]
      );
      const dsCountRes = await raw(
        `SELECT COUNT(*)::int AS n FROM dataset.records WHERE ${dsWhere}`,
        dsParams
      );
      datasetTotal = dsCountRes.rows[0].n;
      datasetRows = dsRes.rows.map((r) => ({
        id: r.id,
        source: 'dataset',
        row_number: r.row_number,
        product_name: r.parsed.product_name,
        category: r.parsed.category,
        stock: r.parsed.stock,
        reorder_level: r.parsed.reorder_level,
        reorder_quantity: r.parsed.reorder_quantity,
        unit_price: r.parsed.unit_price,
        unit_cost: r.parsed.unit_cost,
        units_sold: r.parsed.units_sold,
        expiry_date: r.parsed.expiry_date,
        received_date: r.parsed.received_date,
        issues: r.issues,
      }));
    }

    res.json({
      store_id: p.id,
      active_upload_id: s.active_upload_id,
      page,
      page_size: pageSize,
      total: datasetTotal + manualTotal,
      dataset_total: datasetTotal,
      manual_total: manualTotal,
      items: [...manRes.rows, ...datasetRows],
    });
  } catch (e) {
    console.error('[stores/items] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Add ONE manual item ──
router.post('/:id/items', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    const b = req.body || {};
    if (!b.product_name || typeof b.product_name !== 'string' || !b.product_name.trim()) {
      return fail(res, 400, 'product_name is required');
    }
    const num = (v) => (v == null || v === '' ? null : Number(v));
    const date = (v) => (v == null || v === '' ? null : String(v).slice(0, 10));
    for (const f of ['stock', 'reorder_level', 'reorder_quantity', 'unit_price', 'unit_cost', 'units_sold']) {
      if (b[f] != null && b[f] !== '' && !Number.isFinite(Number(b[f]))) {
        return fail(res, 400, `Invalid ${f}`);
      }
    }
    const r = await raw(
      `INSERT INTO dataset.manual_items
        (store_id, product_name, category, stock, reorder_level, reorder_quantity, unit_price, unit_cost, units_sold, expiry_date, received_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        p.id,
        b.product_name.trim().slice(0, 255),
        b.category ? String(b.category).slice(0, 120) : null,
        num(b.stock) ?? 0,
        num(b.reorder_level),
        num(b.reorder_quantity),
        num(b.unit_price),
        num(b.unit_cost),
        num(b.units_sold),
        date(b.expiry_date),
        date(b.received_date),
      ]
    );
    await recompute(p.id);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('[stores/items] create error');
    fail(res, 500, 'Internal server error');
  }
});

router.put('/:id/items/:itemId', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const pi = parseId(req.params.itemId);
    if (pi.error) return fail(res, 400, 'Invalid item id');
    const cur = await raw('SELECT * FROM dataset.manual_items WHERE id=$1 AND store_id=$2', [pi.id, p.id]);
    if (!cur.rows.length) return fail(res, 404, 'Not found (dataset rows are read-only; manual items only)');
    const m = cur.rows[0];
    const b = req.body || {};
    const num = (v, d) => (v === undefined ? d : (v == null || v === '' ? null : Number(v)));
    const date = (v, d) => (v === undefined ? d : (v == null || v === '' ? null : String(v).slice(0, 10)));
    for (const f of ['stock', 'reorder_level', 'reorder_quantity', 'unit_price', 'unit_cost', 'units_sold']) {
      if (b[f] !== undefined && b[f] != null && b[f] !== '' && !Number.isFinite(Number(b[f]))) {
        return fail(res, 400, `Invalid ${f}`);
      }
    }
    const name = b.product_name !== undefined ? String(b.product_name).trim().slice(0, 255) : m.product_name;
    if (!name) return fail(res, 400, 'product_name cannot be empty');
    const r = await raw(
      `UPDATE dataset.manual_items SET
        product_name=$1, category=$2, stock=$3, reorder_level=$4, reorder_quantity=$5,
        unit_price=$6, unit_cost=$7, units_sold=$8, expiry_date=$9, received_date=$10, updated_at=NOW()
       WHERE id=$11 AND store_id=$12 RETURNING *`,
      [
        name,
        b.category !== undefined ? (b.category ? String(b.category).slice(0, 120) : null) : m.category,
        num(b.stock, m.stock),
        num(b.reorder_level, m.reorder_level),
        num(b.reorder_quantity, m.reorder_quantity),
        num(b.unit_price, m.unit_price),
        num(b.unit_cost, m.unit_cost),
        num(b.units_sold, m.units_sold),
        date(b.expiry_date, m.expiry_date),
        date(b.received_date, m.received_date),
        pi.id, p.id,
      ]
    );
    await recompute(p.id);
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[stores/items] update error');
    fail(res, 500, 'Internal server error');
  }
});

router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const pi = parseId(req.params.itemId);
    if (pi.error) return fail(res, 400, 'Invalid item id');
    if (req.query.confirm !== 'true') {
      return fail(res, 400, 'Confirmation required (confirm=true)');
    }
    const cur = await raw('SELECT id FROM dataset.manual_items WHERE id=$1 AND store_id=$2', [pi.id, p.id]);
    if (!cur.rows.length) return fail(res, 404, 'Not found (dataset rows are read-only; manual items only)');
    await raw('DELETE FROM dataset.manual_items WHERE id=$1 AND store_id=$2', [pi.id, p.id]);
    await recompute(p.id);
    res.json({ deleted: true, id: pi.id });
  } catch (e) {
    console.error('[stores/items] delete error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Metrics ──
router.get('/:id/metrics', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    const r = await raw(
      "SELECT payload, capabilities, computed_at FROM dataset.metrics WHERE scope='store' AND scope_id=$1",
      [p.id]
    );
    if (!r.rows.length) {
      const fresh = await recomputeStoreMetrics(p.id);
      if (!fresh) return fail(res, 404, 'Not found');
      return res.json({ ...fresh.payload, capabilities: fresh.capabilities });
    }
    res.json({
      ...r.rows[0].payload,
      capabilities: r.rows[0].capabilities,
      computed_at: r.rows[0].computed_at,
    });
  } catch (e) {
    console.error('[stores/metrics] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Order list ──
router.get('/:id/order-list', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const s = await getStore(p.id);
    if (!s) return fail(res, 404, 'Not found');
    const r = await raw(
      "SELECT payload FROM dataset.metrics WHERE scope='store' AND scope_id=$1",
      [p.id]
    );
    let orders;
    if (!r.rows.length) {
      const fresh = await recomputeStoreMetrics(p.id);
      if (!fresh) return fail(res, 404, 'Not found');
      orders = fresh.payload.orders;
    } else {
      orders = r.rows[0].payload.orders;
    }
    if (!orders || !orders.available) {
      return res.json({ available: false, unavailable_reason: orders ? orders.unavailable_reason : 'no data' });
    }
    if (req.query.format === 'csv') {
      const fname = sanitizeFilename(`order-list-store-${p.id}.csv`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      res.write(toCsvLine([
        'item', 'category', 'current_stock', 'reorder_point', 'safety_stock', 'avg_daily',
        'recommended_qty', 'formula_source', 'unit_price', 'unit_cost', 'est_cost', 'est_cost_basis',
      ]));
      for (const o of orders.next_batch) {
        res.write(toCsvLine([
          o.item, o.category, o.current_stock, o.reorder_point, o.safety_stock, o.avg_daily,
          o.recommended_qty, o.formula_source, o.unit_price, o.unit_cost, o.est_cost, o.est_cost_basis,
        ]));
      }
      return res.end();
    }
    res.json(orders);
  } catch (e) {
    console.error('[stores/order-list] error');
    fail(res, 500, 'Internal server error');
  }
});

module.exports = router;
