'use strict';

const db = require('../db');

const raw = (text, params) => db.pool.query(text, params);

function normName(name) {
  return String(name == null ? '' : name).trim().toLowerCase();
}

function dayDiff(a, b) {
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
}

function capabilitiesFromMapping(mapping) {
  const m = mapping || {};
  return {
    has_product_name: !!m.product_name,
    has_category: !!m.category,
    has_stock: !!m.stock,
    has_price: !!m.unit_price,
    has_cost: !!m.unit_cost,
    has_sales: !!m.units_sold,
    has_expiry: !!m.expiry_date,
    has_dates: !!(m.received_date || m.last_order_date || m.expiry_date),
    has_reorder: !!(m.reorder_level || m.reorder_quantity),
    has_lead_time: !!m.lead_time_days,
  };
}

function unavailable(reason) {
  return { available: false, unavailable_reason: reason };
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 10000) / 100;
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

function itemBucket(map, key, displayName, category) {
  let it = map.get(key);
  if (!it) {
    it = {
      key,
      item: displayName,
      category: category || null,
      rows: 0,
      stock: null,
      stock_source: null,
      reorder_level: null,
      reorder_quantity: null,
      unit_price: null,
      unit_cost: null,
      units_sold: 0,
      has_units: false,
      has_stock: false,
      latest_date: null,
      expiry_dates: [],
      shelf_lifes: [],
    };
    map.set(key, it);
  }
  if (!it.category && category) it.category = category;
  return it;
}

function absorbParsedRow(map, p) {
  if (!p || !p.product_name) return null;
  const key = normName(p.product_name);
  const it = itemBucket(map, key, p.product_name, p.category);
  it.rows += 1;

  const rowDate = p.received_date || p.last_order_date || p.expiry_date || null;
  if (rowDate && (!it.latest_date || rowDate >= it.latest_date)) it.latest_date = rowDate;

  if (p.stock != null) { it.stock = p.stock; it.stock_source = 'dataset'; it.has_stock = true; }
  if (p.reorder_level != null) it.reorder_level = p.reorder_level;
  if (p.reorder_quantity != null) it.reorder_quantity = p.reorder_quantity;
  if (p.unit_price != null) it.unit_price = p.unit_price;
  if (p.unit_cost != null) it.unit_cost = p.unit_cost;
  if (p.units_sold != null) { it.units_sold += p.units_sold; it.has_units = true; }

  if (p.expiry_date) {
    it.expiry_dates.push(p.expiry_date);
    if (p.received_date) it.shelf_lifes.push(dayDiff(p.expiry_date, p.received_date));
  }
  return it;
}

function absorbManual(map, m) {
  const key = normName(m.product_name);
  const it = itemBucket(map, key, m.product_name, m.category);
  it.rows += 1;
  it.manual = true;
  if (m.stock != null) {
    it.stock = (it.stock || 0) + Number(m.stock);
    it.stock_source = it.stock_source ? it.stock_source + '+manual' : 'manual';
    it.has_stock = true;
  }
  if (m.reorder_level != null && it.reorder_level == null) it.reorder_level = Number(m.reorder_level);
  if (m.reorder_quantity != null && it.reorder_quantity == null) it.reorder_quantity = Number(m.reorder_quantity);
  if (m.unit_price != null && it.unit_price == null) it.unit_price = Number(m.unit_price);
  if (m.unit_cost != null && it.unit_cost == null) it.unit_cost = Number(m.unit_cost);
  if (m.units_sold != null) { it.units_sold += Number(m.units_sold); it.has_units = true; }
  const exp = m.expiry_date ? String(m.expiry_date).slice(0, 10) : null;
  const rec = m.received_date ? String(m.received_date).slice(0, 10) : null;
  if (exp) {
    it.expiry_dates.push(exp);
    if (rec) it.shelf_lifes.push(dayDiff(exp, rec));
  }
  const rowDate = rec || exp;
  if (rowDate && (!it.latest_date || rowDate >= it.latest_date)) it.latest_date = rowDate;
  return it;
}

async function loadStoreInputs(storeId) {
  const storeRes = await raw('SELECT * FROM dataset.stores WHERE id=$1', [storeId]);
  if (!storeRes.rows.length) return null;
  const store = storeRes.rows[0];

  let upload = null;
  let mapping = {};
  let records = [];
  if (store.active_upload_id) {
    const upRes = await raw('SELECT * FROM dataset.uploads WHERE id=$1', [store.active_upload_id]);
    if (upRes.rows.length) {
      upload = upRes.rows[0];
      mapping = upload.mapping || {};
      const recRes = await raw('SELECT parsed FROM dataset.records WHERE upload_id=$1', [store.active_upload_id]);
      records = recRes.rows;
    }
  }

  const manRes = await raw('SELECT * FROM dataset.manual_items WHERE store_id=$1', [storeId]);
  return { store, upload, mapping, records, manual: manRes.rows };
}

function buildCapabilities(mapping, manual, hasUpload) {
  const caps = capabilitiesFromMapping(mapping);
  caps.has_manual = manual.length > 0;
  caps.has_upload = hasUpload;
  caps.has_expiry = caps.has_expiry || manual.some((m) => m.expiry_date);
  caps.has_price = caps.has_price || manual.some((m) => m.unit_price != null);
  caps.has_cost = caps.has_cost || manual.some((m) => m.unit_cost != null);
  caps.has_stock = caps.has_stock || manual.some((m) => m.stock != null);
  caps.has_sales = caps.has_sales || manual.some((m) => m.units_sold != null);
  caps.has_dates = caps.has_dates || manual.some((m) => m.expiry_date || m.received_date);
  caps.has_reorder = caps.has_reorder || manual.some((m) => m.reorder_level != null || m.reorder_quantity != null);
  caps.has_category = caps.has_category || manual.some((m) => m.category);
  return caps;
}

function computeAnalytics(inputs) {
  const { store, upload, mapping, records, manual } = inputs;
  const map = new Map();
  let maxDate = null;
  let minDate = null;
  const monthly = {};
  const salesDateField = mapping.received_date ? 'received_date'
    : mapping.last_order_date ? 'last_order_date'
    : mapping.expiry_date ? 'expiry_date' : null;

  function trackDate(d) {
    if (!d) return;
    if (!maxDate || d > maxDate) maxDate = d;
    if (!minDate || d < minDate) minDate = d;
  }

  for (const r of records) {
    const p = r.parsed || {};
    absorbParsedRow(map, p);
    trackDate(p.received_date);
    trackDate(p.last_order_date);
    trackDate(p.expiry_date);
    if (salesDateField && p[salesDateField] && p.units_sold != null) {
      const month = String(p[salesDateField]).slice(0, 7);
      monthly[month] = (monthly[month] || 0) + p.units_sold;
    }
  }
  for (const m of manual) {
    absorbManual(map, m);
    trackDate(m.expiry_date ? String(m.expiry_date).slice(0, 10) : null);
    trackDate(m.received_date ? String(m.received_date).slice(0, 10) : null);
    if (m.units_sold != null && m.received_date) {
      const month = String(m.received_date).slice(0, 10).slice(0, 7);
      monthly[month] = (monthly[month] || 0) + Number(m.units_sold);
    }
  }

  const anchor = maxDate || (upload && upload.uploaded_at ? new Date(upload.uploaded_at).toISOString().slice(0, 10) : null);
  const windowDays = maxDate && minDate ? Math.max(1, dayDiff(maxDate, minDate) + 1) : null;
  const items = [...map.values()];
  const capabilities = buildCapabilities(mapping, manual, !!upload);

  // ── (b) EXPIRY ──
  let expiry;
  if (!capabilities.has_expiry) {
    expiry = unavailable('no expiry column mapped');
  } else {
    const withExpiry = items.filter((it) => it.expiry_dates.length > 0);
    const bands = { Critical: 0, High: 0, Watch: 0, Stable: 0 };
    const shelfHistogram = { '0-7': 0, '8-14': 0, '15-30': 0, '31-60': 0, '60+': 0 };
    const expiredByCategory = {};

    const enriched = withExpiry.map((it) => {
      const rowsWithExpiry = it.expiry_dates.length;
      const expired = it.expiry_dates.filter((d) => anchor && d < anchor).length;
      let shelfAvg = null;
      if (it.shelf_lifes.length) {
        shelfAvg = Math.round((it.shelf_lifes.reduce((a, b) => a + b, 0) / it.shelf_lifes.length) * 10) / 10;
      } else if (anchor) {
        const diffs = it.expiry_dates.map((d) => dayDiff(d, anchor));
        shelfAvg = Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10;
      }
      const shelfMin = it.shelf_lifes.length ? Math.min(...it.shelf_lifes) : null;
      const risk = rowsWithExpiry ? Math.round((expired / rowsWithExpiry) * 10000) / 100 : 0;
      let band;
      if ((shelfAvg != null && shelfAvg <= 7) || risk >= 50) band = 'Critical';
      else if (shelfAvg != null && shelfAvg <= 14) band = 'High';
      else if (shelfAvg != null && shelfAvg <= 30) band = 'Watch';
      else band = 'Stable';
      bands[band]++;

      for (const s of it.shelf_lifes) {
        if (s <= 7) shelfHistogram['0-7']++;
        else if (s <= 14) shelfHistogram['8-14']++;
        else if (s <= 30) shelfHistogram['15-30']++;
        else if (s <= 60) shelfHistogram['31-60']++;
        else shelfHistogram['60+']++;
      }
      if (expired > 0) {
        const c = it.category || '(uncategorized)';
        expiredByCategory[c] = (expiredByCategory[c] || 0) + expired;
      }
      return {
        item: it.item,
        category: it.category,
        rows: rowsWithExpiry,
        shelf_life_min: shelfMin,
        shelf_life_avg: shelfAvg,
        rows_expired: expired,
        expiry_risk: risk,
        risk_band: band,
      };
    });

    const mostExpiring = [...enriched]
      .sort((a, b) => (b.rows_expired - a.rows_expired) || ((a.shelf_life_avg ?? 1e9) - (b.shelf_life_avg ?? 1e9)))
      .slice(0, 25);

    expiry = {
      available: true,
      anchor_date: anchor,
      bands_histogram: bands,
      most_expiring: mostExpiring,
      expired_by_category: expiredByCategory,
      shelf_life_histogram: shelfHistogram,
      items: enriched.length,
      total_expired_rows: enriched.reduce((a, b) => a + b.rows_expired, 0),
    };
  }

  // ── (c) SALES ──
  let sales;
  if (!capabilities.has_sales) {
    sales = unavailable('no units sold column mapped');
  } else {
    const totalUnits = items.reduce((a, b) => a + b.units_sold, 0);
    const ranked = items
      .map((it) => ({
        item: it.item,
        category: it.category,
        total_units: it.units_sold,
        share_pct: pct(it.units_sold, totalUnits),
        avg_per_day: windowDays ? Math.round((it.units_sold / windowDays) * 100) / 100 : null,
        stock: it.has_stock ? it.stock : null,
        sell_through: (it.has_stock && (it.units_sold + (it.stock || 0)) > 0)
          ? Math.round((it.units_sold / (it.units_sold + (it.stock || 0))) * 10000) / 100
          : null,
        unit_price: it.unit_price,
        unit_cost: it.unit_cost,
        revenue: (it.unit_price != null) ? Math.round(it.units_sold * it.unit_price * 100) / 100 : null,
        profit: (it.unit_price != null && it.unit_cost != null)
          ? Math.round(it.units_sold * (it.unit_price - it.unit_cost) * 100) / 100 : null,
      }))
      .sort((a, b) => b.total_units - a.total_units)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const totals = ranked.map((r) => r.total_units).sort((a, b) => a - b);
    const p25 = quantile(totals, 0.25);
    const lowSellers = ranked
      .filter((r) => r.total_units === 0 || r.total_units <= p25)
      .map((r) => ({ ...r, reason: r.total_units === 0 ? 'zero' : 'bottom_quartile' }));

    const byCategory = {};
    for (const r of ranked) {
      const c = r.category || '(uncategorized)';
      byCategory[c] = (byCategory[c] || 0) + r.total_units;
    }

    const monthlySeries = Object.keys(monthly).length
      ? Object.keys(monthly).sort().map((month) => ({ month, units: monthly[month] }))
      : null;

    const totalStock = items.reduce((a, b) => a + (b.has_stock ? (b.stock || 0) : 0), 0);
    const profitItems = ranked.filter((r) => r.profit != null);
    sales = {
      available: true,
      total_units: totalUnits,
      top_sellers: ranked.slice(0, 25),
      low_sellers: lowSellers.slice(0, 25),
      by_category: byCategory,
      monthly_series: monthlySeries,
      sell_through: (totalUnits + totalStock) > 0
        ? Math.round((totalUnits / (totalUnits + totalStock)) * 10000) / 100
        : null,
      profit: capabilities.has_cost ? {
        available: true,
        total_revenue: Math.round(profitItems.reduce((a, b) => a + (b.revenue || 0), 0) * 100) / 100,
        total_profit: Math.round(profitItems.reduce((a, b) => a + (b.profit || 0), 0) * 100) / 100,
        items: profitItems.slice(0, 25),
      } : unavailable('no unit cost column mapped'),
      items: ranked,
    };
  }

  // ── (d) ORDERS ──
  const lead = Number(store.lead_time_days) || 3;
  const safety = Number(store.safety_days) || 2;
  const orderItems = items.map((it) => {
    const currentStock = it.has_stock ? (it.stock || 0) : 0;
    const avgDaily = windowDays ? Math.round((it.units_sold / windowDays) * 100) / 100 : 0;
    const reorderPoint = (mapping.reorder_level && it.reorder_level != null)
      ? it.reorder_level
      : Math.ceil(avgDaily * lead);
    const safetyStock = Math.ceil(avgDaily * safety);
    let recommendedQty;
    let formulaSource;
    if (mapping.reorder_quantity && it.reorder_quantity != null) {
      formulaSource = 'dataset_reorder_qty';
      recommendedQty = currentStock <= reorderPoint ? it.reorder_quantity : 0;
    } else {
      formulaSource = 'gap_formula';
      recommendedQty = Math.max(0, Math.ceil(reorderPoint + safetyStock - currentStock));
    }
    let estCost = null;
    let estCostBasis = null;
    if (recommendedQty > 0) {
      if (it.unit_cost != null) {
        estCost = Math.round(recommendedQty * it.unit_cost * 100) / 100;
        estCostBasis = 'unit_cost';
      } else if (it.unit_price != null) {
        estCost = Math.round(recommendedQty * it.unit_price * 100) / 100;
        estCostBasis = 'unit_price';
      }
    }
    return {
      item: it.item,
      category: it.category,
      current_stock: currentStock,
      reorder_point: reorderPoint,
      safety_stock: safetyStock,
      avg_daily: avgDaily,
      recommended_qty: recommendedQty,
      formula_source: formulaSource,
      unit_price: it.unit_price,
      unit_cost: it.unit_cost,
      est_cost: estCost,
      est_cost_basis: estCostBasis,
    };
  });

  const nextBatch = orderItems
    .filter((o) => o.recommended_qty > 0)
    .sort((a, b) => b.recommended_qty - a.recommended_qty);

  const ordersByCategory = {};
  const ordersByFormula = {};
  for (const o of nextBatch) {
    const c = o.category || '(uncategorized)';
    ordersByCategory[c] = (ordersByCategory[c] || 0) + o.recommended_qty;
    ordersByFormula[o.formula_source] = (ordersByFormula[o.formula_source] || 0) + 1;
  }

  const costCapable = nextBatch.some((o) => o.est_cost_basis === 'unit_cost');
  const priceCapable = nextBatch.some((o) => o.est_cost_basis === 'unit_price');

  const orders = {
    available: true,
    next_batch: nextBatch.slice(0, 100),
    totals: {
      items_to_order: nextBatch.length,
      total_units: nextBatch.reduce((a, b) => a + b.recommended_qty, 0),
      total_est_cost: Math.round(nextBatch.reduce((a, b) => a + (b.est_cost || 0), 0) * 100) / 100,
      est_cost_basis: costCapable ? 'unit_cost' : (priceCapable ? 'unit_price' : null),
    },
    by_category: ordersByCategory,
    by_formula_source: ordersByFormula,
    items: orderItems,
  };

  const payload = {
    store: {
      id: store.id,
      name: store.name,
      city: store.city,
      lead_time_days: lead,
      safety_days: safety,
      active_upload_id: store.active_upload_id || null,
    },
    upload: upload ? {
      id: upload.id,
      filename: upload.filename,
      row_count: upload.row_count,
      rows_matched: upload.rows_matched,
      rows_discarded: upload.rows_discarded,
      uploaded_at: upload.uploaded_at,
    } : null,
    anchor_date: anchor,
    window_days: windowDays,
    item_count: items.length,
    record_count: records.length,
    manual_item_count: manual.length,
    expiry,
    sales,
    orders,
    computed_at: new Date().toISOString(),
  };

  return { payload, capabilities };
}

async function recomputeStoreMetrics(storeId) {
  const inputs = await loadStoreInputs(storeId);
  if (!inputs) return null;
  const { payload, capabilities } = computeAnalytics(inputs);
  await raw(
    `INSERT INTO dataset.metrics (scope, scope_id, payload, capabilities, computed_at)
     VALUES ('store', $1, $2::jsonb, $3::jsonb, NOW())
     ON CONFLICT (scope, scope_id)
     DO UPDATE SET payload = $2::jsonb, capabilities = $3::jsonb, computed_at = NOW()`,
    [storeId, JSON.stringify(payload), JSON.stringify(capabilities)]
  );
  return { payload, capabilities };
}

async function recomputeGlobalMetrics() {
  const storesRes = await raw('SELECT id FROM dataset.stores ORDER BY id');
  const cards = [];
  const nameTotals = new Map();
  const consolidated = new Map();
  const categoryMix = {};

  for (const s of storesRes.rows) {
    const mRes = await raw(
      "SELECT payload, capabilities, computed_at FROM dataset.metrics WHERE scope='store' AND scope_id=$1",
      [s.id]
    );
    const row = mRes.rows[0];
    if (!row) continue;
    const p = row.payload;
    const caps = row.capabilities;
    cards.push({
      store_id: s.id,
      name: p.store.name,
      city: p.store.city,
      record_count: p.record_count,
      item_count: p.item_count,
      capabilities: caps,
      expiry_available: !!(p.expiry && p.expiry.available),
      total_expired_rows: p.expiry && p.expiry.available ? p.expiry.total_expired_rows : 0,
      sales_available: !!(p.sales && p.sales.available),
      total_units: p.sales && p.sales.available ? p.sales.total_units : null,
      total_profit: p.sales && p.sales.available && p.sales.profit && p.sales.profit.available
        ? p.sales.profit.total_profit : null,
      items_to_order: p.orders.totals.items_to_order,
      total_order_units: p.orders.totals.total_units,
      total_est_cost: p.orders.totals.total_est_cost,
      est_cost_basis: p.orders.totals.est_cost_basis,
      computed_at: row.computed_at,
    });

    if (p.sales && p.sales.available) {
      for (const it of p.sales.items) {
        const key = normName(it.item);
        if (!nameTotals.has(key)) nameTotals.set(key, { item: it.item, stores: [] });
        nameTotals.get(key).stores.push({
          store_id: s.id,
          name: p.store.name,
          total_units: it.total_units,
          category: it.category,
        });
      }
    }
    if (p.orders && p.orders.available) {
      for (const o of p.orders.items) {
        const key = normName(o.item);
        if (!consolidated.has(key)) {
          consolidated.set(key, { item: o.item, category: o.category, total_recommended_qty: 0, stores: [] });
        }
        const c = consolidated.get(key);
        if (o.recommended_qty > 0) {
          c.total_recommended_qty += o.recommended_qty;
          c.stores.push({
            store_id: s.id,
            name: p.store.name,
            recommended_qty: o.recommended_qty,
            formula_source: o.formula_source,
            unit_price: o.unit_price,
            unit_cost: o.unit_cost,
            est_cost: o.est_cost,
          });
        }
      }
    }
    if (p.sales && p.sales.available && p.sales.by_category) {
      categoryMix[s.id] = { name: p.store.name, categories: p.sales.by_category };
    } else if (p.expiry && p.expiry.available && p.expiry.expired_by_category) {
      categoryMix[s.id] = { name: p.store.name, categories: p.expiry.expired_by_category };
    }
  }

  const commonItems = [...nameTotals.values()]
    .filter((x) => x.stores.length >= 2)
    .map((x) => {
      const sorted = [...x.stores].sort((a, b) => b.total_units - a.total_units);
      return {
        item: x.item,
        store_count: x.stores.length,
        best_store: sorted[0] ? sorted[0].name : null,
        stores: sorted,
      };
    })
    .sort((a, b) => b.store_count - a.store_count)
    .slice(0, 50);

  const consolidatedOrders = [...consolidated.values()]
    .filter((x) => x.total_recommended_qty > 0)
    .sort((a, b) => b.total_recommended_qty - a.total_recommended_qty)
    .slice(0, 100);

  const payload = {
    stores: cards,
    common_items: commonItems,
    consolidated_orders: consolidatedOrders,
    category_mix: categoryMix,
    store_count: cards.length,
    computed_at: new Date().toISOString(),
  };
  const capabilities = { stores_with_upload: cards.filter((c) => c.record_count > 0).length };

  await raw(
    `INSERT INTO dataset.metrics (scope, scope_id, payload, capabilities, computed_at)
     VALUES ('global', 0, $1::jsonb, $2::jsonb, NOW())
     ON CONFLICT (scope, scope_id)
     DO UPDATE SET payload = $1::jsonb, capabilities = $2::jsonb, computed_at = NOW()`,
    [JSON.stringify(payload), JSON.stringify(capabilities)]
  );
  return payload;
}

async function recomputeAll() {
  const storesRes = await raw('SELECT id FROM dataset.stores ORDER BY id');
  for (const s of storesRes.rows) {
    await recomputeStoreMetrics(s.id);
  }
  await recomputeGlobalMetrics();
}

module.exports = {
  recomputeStoreMetrics,
  recomputeGlobalMetrics,
  recomputeAll,
  computeAnalytics,
  loadStoreInputs,
  capabilitiesFromMapping,
};
