'use strict';

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { parse: parseCsvSync } = require('csv-parse/sync');
const XLSX = require('xlsx');
const db = require('../db');
const {
  resolveMapping, normalizeRows, buildProfile, capCell,
} = require('../lib/datasetParse');
const { toCsvLine, sanitizeFilename } = require('../lib/csvSafe');
const { recomputeStoreMetrics, recomputeGlobalMetrics } = require('../lib/datasetAnalytics');

const router = express.Router();
const raw = (text, params) => db.pool.query(text, params);

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_ROWS = 200000;
const MAX_COLS = 200;
const MIN_FILTER_ROWS = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

async function storageDegraded() {
  try {
    const r = await raw("SELECT to_regclass('dataset.uploads') AS t");
    return !r.rows.length || r.rows[0].t == null;
  } catch (e) {
    return true;
  }
}

function parseId(rawId) {
  if (!/^\d+$/.test(String(rawId))) return { error: 400 };
  const id = parseInt(rawId, 10);
  if (id <= 0 || id > 999999999) return { error: 400 };
  return { id };
}

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

// ── Health ──
router.get('/health', async (req, res) => {
  if (await storageDegraded()) {
    return res.json({ storage: 'degraded', uploads: 0 });
  }
  try {
    const r = await raw('SELECT COUNT(*)::int AS n FROM dataset.uploads');
    res.json({ storage: 'postgres', uploads: r.rows[0].n });
  } catch (e) {
    res.json({ storage: 'degraded', uploads: 0 });
  }
});

// ── Upload ──
function uploadMiddleware(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 413, 'File too large');
      return fail(res, 400, 'Upload failed');
    }
    next();
  });
}
router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    if (await storageDegraded()) return fail(res, 503, 'Storage unavailable');
    if (!req.file) return fail(res, 400, 'File is required');
    if (req.file.size > MAX_BYTES) return fail(res, 413, 'File too large');

    const sid = parseId(req.body.store_id);
    if (sid.error) return fail(res, 400, 'Invalid store_id');
    const storeId = sid.id;

    const storeRes = await raw('SELECT id FROM dataset.stores WHERE id=$1', [storeId]);
    if (!storeRes.rows.length) return fail(res, 404, 'Store not found');

    let mappingInput = {};
    if (req.body.mapping) {
      try { mappingInput = JSON.parse(req.body.mapping); } catch (e) { return fail(res, 400, 'Invalid mapping JSON'); }
    }
    let filterObj = null;
    if (req.body.filter) {
      try { filterObj = JSON.parse(req.body.filter); } catch (e) { return fail(res, 400, 'Invalid filter JSON'); }
      if (!filterObj || typeof filterObj !== 'object' || filterObj.column == null || filterObj.value == null) {
        return fail(res, 400, 'Invalid filter');
      }
    }

    const originalName = (req.file.originalname || 'upload');
    if (!/\.(csv|xlsx)$/i.test(originalName)) return fail(res, 400, 'Unsupported file format');
    const ext = /\.xlsx$/i.test(originalName) ? 'xlsx' : 'csv';

    const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const dupRes = await raw(
      'SELECT * FROM dataset.uploads WHERE store_id=$1 AND sha256=$2 ORDER BY id DESC LIMIT 1',
      [storeId, sha256]
    );
    if (dupRes.rows.length) {
      return res.json({ duplicate: true, upload: dupRes.rows[0] });
    }

    let header;
    let rows;
    try {
      if (ext === 'csv') {
        const parsedRows = parseCsvSync(req.file.buffer, {
          bom: true,
          relax_column_count: true,
          skip_empty_lines: true,
        });
        if (!parsedRows.length) return fail(res, 400, 'Empty file');
        header = parsedRows[0].map((h) => capCell(h).trim());
        rows = parsedRows.slice(1);
      } else {
        const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) return fail(res, 400, 'Empty file');
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false, raw: false });
        if (!aoa.length) return fail(res, 400, 'Empty file');
        header = aoa[0].map((h) => capCell(h).trim());
        rows = aoa.slice(1);
      }
    } catch (e) {
      return fail(res, 400, 'File could not be parsed');
    }

    if (header.length > MAX_COLS) return fail(res, 400, 'Too many columns');
    if (header.some((h) => !h)) return fail(res, 400, 'Empty header cell');
    if (new Set(header.map((h) => h.toLowerCase())).size !== header.length) {
      return fail(res, 400, 'Duplicate header columns');
    }
    if (rows.length > MAX_ROWS) return fail(res, 422, 'Too many rows');

    const { mapping, suggested, errors } = resolveMapping(header, mappingInput);
    if (errors.length) return fail(res, 400, 'Header/schema mismatch');
    if (!mapping.product_name) return fail(res, 400, 'Header/schema mismatch');

    let effectiveFilter = filterObj;
    if (effectiveFilter && !effectiveFilter.column && mapping.store_filter_column) {
      effectiveFilter = { column: mapping.store_filter_column, value: effectiveFilter.value };
    }
    if (effectiveFilter && !header.includes(String(effectiveFilter.column))) {
      const found = header.find((h) => h.toLowerCase() === String(effectiveFilter.column).toLowerCase());
      if (!found) return fail(res, 400, 'Header/schema mismatch');
      effectiveFilter = { column: found, value: effectiveFilter.value };
    }

    const normalized = normalizeRows(header, rows, mapping, effectiveFilter);
    if (effectiveFilter && normalized.rows_matched < MIN_FILTER_ROWS) {
      return fail(res, 400,
        `Filter leaves only ${normalized.rows_matched} rows (minimum ${MIN_FILTER_ROWS}); consider loading the whole file`);
    }

    const filename = sanitizeFilename(originalName);
    const client = await db.pool.connect();
    let uploadId;
    try {
      await client.query('BEGIN');
      const upRes = await client.query(
        `INSERT INTO dataset.uploads
          (store_id, filename, format, sha256, size_bytes, row_count, rows_matched, rows_discarded,
           column_count, header_raw, mapping, filter, parse_errors, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13,'ready')
         RETURNING *`,
        [
          storeId, filename, ext, sha256, req.file.size,
          normalized.rows.length, normalized.rows_matched, normalized.rows_discarded,
          header.length, header.join(','),
          JSON.stringify({ ...mapping, _date_formats: normalized.date_formats, _suggested: suggested }),
          effectiveFilter ? JSON.stringify(effectiveFilter) : null,
          normalized.parse_errors,
        ]
      );
      uploadId = upRes.rows[0].id;

      const BATCH = 500;
      for (let i = 0; i < normalized.rows.length; i += BATCH) {
        const chunk = normalized.rows.slice(i, i + BATCH);
        const vals = [];
        const params = [];
        chunk.forEach((r, j) => {
          const b = j * 5;
          vals.push(`($${b + 1}, $${b + 2}, $${b + 3}::jsonb, $${b + 4}::jsonb, $${b + 5}::jsonb)`);
          params.push(uploadId, r.row_number, JSON.stringify(r.raw), JSON.stringify(r.parsed), JSON.stringify(r.issues));
        });
        await client.query(
          `INSERT INTO dataset.records (upload_id, row_number, raw, parsed, issues) VALUES ${vals.join(',')}`,
          params
        );
      }

      const profile = buildProfile(header, normalized, mapping, {
        upload_id: uploadId, filename, format: ext, size_bytes: req.file.size, filter: effectiveFilter,
      });
      await client.query(
        `INSERT INTO dataset.profiles (upload_id, profile, computed_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (upload_id) DO UPDATE SET profile = $2::jsonb, computed_at = NOW()`,
        [uploadId, JSON.stringify(profile)]
      );

      await client.query('UPDATE dataset.stores SET active_upload_id=$1 WHERE id=$2', [uploadId, storeId]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[dataset/upload] failed', { store_id: storeId, size: req.file.size, sha256: sha256.slice(0, 12) });
      return fail(res, 500, 'Upload failed');
    } finally {
      client.release();
    }

    console.log('[dataset/upload]', {
      upload_id: uploadId, store_id: storeId, size: req.file.size,
      sha256: sha256.slice(0, 12), rows: normalized.rows.length, filter: effectiveFilter,
    });

    try {
      await recomputeStoreMetrics(storeId);
      await recomputeGlobalMetrics();
    } catch (e) {
      console.error('[dataset/upload] metrics recompute failed', { upload_id: uploadId });
    }

    const created = await raw('SELECT * FROM dataset.uploads WHERE id=$1', [uploadId]);
    const warnings = [];
    if (effectiveFilter && normalized.rows_discarded > 0) {
      warnings.push(`${normalized.rows_discarded} rows discarded by filter`);
    }
    if (normalized.date_formats.length > 1) {
      warnings.push(`mixed date formats detected: ${normalized.date_formats.join(', ')}`);
    }
    res.status(201).json({
      upload: created.rows[0],
      suggested_mapping: suggested,
      warnings,
      rows_matched: normalized.rows_matched,
      rows_discarded: normalized.rows_discarded,
      parse_errors: normalized.parse_errors,
      date_formats: normalized.date_formats,
    });
  } catch (e) {
    console.error('[dataset/upload] unexpected error');
    if (!res.headersSent) fail(res, 500, 'Upload failed');
  }
});

// ── List uploads ──
router.get('/uploads', async (req, res) => {
  try {
    const q = [];
    const params = [];
    if (req.query.store_id != null) {
      const p = parseId(req.query.store_id);
      if (p.error) return fail(res, 400, 'Invalid store_id');
      params.push(p.id);
      q.push(`store_id=$${params.length}`);
    }
    const where = q.length ? `WHERE ${q.join(' AND ')}` : '';
    const r = await raw(`SELECT * FROM dataset.uploads ${where} ORDER BY id DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (e) {
    console.error('[dataset/uploads] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Single upload ──
router.get('/uploads/:id', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const r = await raw('SELECT * FROM dataset.uploads WHERE id=$1', [p.id]);
    if (!r.rows.length) return fail(res, 404, 'Not found');
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[dataset/uploads/:id] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Rows ──
router.get('/uploads/:id/rows', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const up = await raw('SELECT id FROM dataset.uploads WHERE id=$1', [p.id]);
    if (!up.rows.length) return fail(res, 404, 'Not found');
    let limit = parseInt(req.query.limit || '50', 10);
    let offset = parseInt(req.query.offset || '0', 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 50;
    if (limit > 200) limit = 200;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    const r = await raw(
      'SELECT id, row_number, raw, parsed, issues FROM dataset.records WHERE upload_id=$1 ORDER BY row_number LIMIT $2 OFFSET $3',
      [p.id, limit, offset]
    );
    const cnt = await raw('SELECT COUNT(*)::int AS n FROM dataset.records WHERE upload_id=$1', [p.id]);
    res.json({ total: cnt.rows[0].n, limit, offset, rows: r.rows });
  } catch (e) {
    console.error('[dataset/rows] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Profile ──
router.get('/uploads/:id/profile', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const up = await raw('SELECT id FROM dataset.uploads WHERE id=$1', [p.id]);
    if (!up.rows.length) return fail(res, 404, 'Not found');
    const r = await raw('SELECT profile, computed_at FROM dataset.profiles WHERE upload_id=$1', [p.id]);
    if (!r.rows.length) return fail(res, 404, 'Not found');
    res.json({ upload_id: p.id, profile: r.rows[0].profile, computed_at: r.rows[0].computed_at });
  } catch (e) {
    console.error('[dataset/profile] error');
    fail(res, 500, 'Internal server error');
  }
});

// ── Export cleaned CSV ──
router.get('/uploads/:id/export', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    const up = await raw('SELECT * FROM dataset.uploads WHERE id=$1', [p.id]);
    if (!up.rows.length) return fail(res, 404, 'Not found');
    const header = (up.rows[0].header_raw || '').split(',').filter(Boolean);
    const base = String(up.rows[0].filename || 'export').replace(/\.(csv|xlsx)$/i, '');
    const fname = sanitizeFilename(`dataset-${p.id}-${base}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.write(toCsvLine(header));
    const BATCH = 1000;
    for (let offset = 0; ; offset += BATCH) {
      const r = await raw(
        'SELECT raw FROM dataset.records WHERE upload_id=$1 ORDER BY row_number LIMIT $2 OFFSET $3',
        [p.id, BATCH, offset]
      );
      if (!r.rows.length) break;
      for (const row of r.rows) {
        res.write(toCsvLine(header.map((h) => (row.raw ? row.raw[h] : ''))));
      }
    }
    res.end();
  } catch (e) {
    console.error('[dataset/export] failed', { upload_id: req.params.id });
    if (!res.headersSent) fail(res, 500, 'Export failed');
  }
});

// ── Delete upload (requires ?confirm=true — no auth exists) ──
router.delete('/uploads/:id', async (req, res) => {
  try {
    const p = parseId(req.params.id);
    if (p.error) return fail(res, 400, 'Invalid id');
    if (req.query.confirm !== 'true') {
      return fail(res, 400, 'Confirmation required (confirm=true)');
    }
    if (await storageDegraded()) return fail(res, 503, 'Storage unavailable');
    const up = await raw('SELECT * FROM dataset.uploads WHERE id=$1', [p.id]);
    if (!up.rows.length) return fail(res, 404, 'Not found');
    const storeId = up.rows[0].store_id;
    await raw('DELETE FROM dataset.uploads WHERE id=$1', [p.id]);
    await raw('UPDATE dataset.stores SET active_upload_id = NULL WHERE active_upload_id=$1', [p.id]);
    try {
      await recomputeStoreMetrics(storeId);
      await recomputeGlobalMetrics();
    } catch (e) {
      console.error('[dataset/delete] metrics recompute failed', { upload_id: p.id });
    }
    console.log('[dataset/delete]', { upload_id: p.id, store_id: storeId });
    res.json({ deleted: true, id: p.id });
  } catch (e) {
    console.error('[dataset/delete] error');
    fail(res, 500, 'Internal server error');
  }
});

module.exports = router;
