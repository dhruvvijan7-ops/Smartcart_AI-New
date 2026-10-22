'use strict';

const SEMANTICS = [
  'product_id', 'product_name', 'category', 'stock', 'reorder_level',
  'reorder_quantity', 'unit_price', 'unit_cost', 'units_sold',
  'expiry_date', 'received_date', 'last_order_date', 'lead_time_days',
  'store_filter_column',
];

const ALIASES = {
  product_id: ['productid', 'id', 'sku', 'inventoryid', 'recordid', 'productcode', 'itemcode'],
  product_name: ['productname', 'name', 'item', 'product', 'itemname', 'description'],
  category: ['category', 'catagory', 'productcategory', 'department', 'producttype'],
  stock: ['stock', 'stockquantity', 'quantityavailable', 'inventorylevel', 'currentstock', 'onhand', 'quantityonhand', 'stocklevel'],
  reorder_level: ['reorderlevel', 'reorderpoint', 'minimumstock', 'minstock'],
  reorder_quantity: ['reorderquantity', 'orderquantity', 'reorderqty', 'suggestedorderquantity', 'eoq'],
  unit_price: ['unitprice', 'price', 'retailprice', 'sellingprice', 'saleprice'],
  unit_cost: ['unitcost', 'cost', 'buyingprice', 'purchaseprice', 'wholesaleprice'],
  units_sold: ['unitssold', 'salesvolume', 'sales', 'dailydemand', 'demand', 'quantitysold', 'unitsales', 'soldquantity'],
  expiry_date: ['expirationdate', 'expirydate', 'bestbefore', 'expiration', 'expiry', 'useby', 'sellby'],
  received_date: ['datereceived', 'receiveddate', 'date', 'transactiondate', 'purchaseorderdate', 'restockdate', 'stockupdatedate'],
  last_order_date: ['lastorderdate', 'orderdate', 'lastrestockdate'],
  lead_time_days: ['leadtimedays', 'leadtime', 'deliverytime'],
  store_filter_column: ['storeid', 'store', 'storename', 'storecode', 'branchid', 'branch'],
};

const DATE_FORMATS = ['yyyy-mm-dd', 'M/d/yyyy', 'dd-mm-yyyy'];

function normHeader(h) {
  return String(h == null ? '' : h).replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function capCell(v) {
  let s = v == null ? '' : String(v);
  s = s.replace(/\0/g, '');
  if (s.length > 512) s = s.slice(0, 512);
  return s;
}

function parseNumber(raw) {
  const s = capCell(raw).trim();
  if (!s) return { value: null, ok: true };
  let t = s.replace(/[$€£₹,\s]/g, '');
  if (t.startsWith('-') && /^-?\d*\.?\d+$/.test(t)) { /* negative ok */ }
  else if (t.startsWith('-')) return { value: null, ok: false };
  if (!/^-?\d*\.?\d+$/.test(t)) return { value: null, ok: false };
  const n = Number(t);
  if (!Number.isFinite(n)) return { value: null, ok: false };
  return { value: n, ok: true };
}

function parseSafeInt(raw) {
  const s = capCell(raw).trim();
  if (!s) return { value: null, ok: true };
  const t = s.replace(/[,\s]/g, '');
  if (!/^-?\d+$/.test(t)) {
    const num = parseNumber(s);
    if (num.ok && num.value != null) return { value: Math.round(num.value), ok: true };
    return { value: null, ok: false };
  }
  return { value: parseInt(t, 10), ok: true };
}

function pad2(n) { return String(n).padStart(2, '0'); }

function parseDate(raw) {
  const s = capCell(raw).trim();
  if (!s) return { value: null, ok: true, format: null };
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    return mkDate(+m[1], +m[2], +m[3], 'yyyy-mm-dd');
  }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    return mkDate(+m[3], +m[1], +m[2], 'M/d/yyyy');
  }
  if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) {
    return mkDate(+m[3], +m[2], +m[1], 'dd-mm-yyyy');
  }
  return { value: null, ok: false, format: null };
}

function mkDate(y, mo, d, format) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return { value: null, ok: false, format };
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return { value: null, ok: false, format };
  return { value: `${y}-${pad2(mo)}-${pad2(d)}`, ok: true, format };
}

function suggestMapping(header) {
  const mapping = {};
  const normed = header.map(normHeader);
  for (const sem of SEMANTICS) {
    mapping[sem] = null;
    for (const alias of ALIASES[sem]) {
      const idx = normed.indexOf(alias);
      if (idx !== -1) { mapping[sem] = header[idx]; break; }
    }
    if (!mapping[sem]) {
      for (const alias of ALIASES[sem]) {
        if (alias.length < 4) continue;
        const idx = normed.findIndex((h) => h.length >= 4 && h.includes(alias));
        if (idx !== -1) { mapping[sem] = header[idx]; break; }
      }
    }
  }
  return mapping;
}

function resolveMapping(header, clientMapping) {
  const suggested = suggestMapping(header);
  const headerSet = new Set(header);
  const normToActual = new Map(header.map((h) => [normHeader(h), h]));
  const mapping = {};
  const errors = [];
  const client = clientMapping && typeof clientMapping === 'object' ? clientMapping : {};
  for (const sem of SEMANTICS) {
    let col = client[sem];
    if (col === undefined || col === null || col === '') {
      mapping[sem] = suggested[sem] || null;
      continue;
    }
    if (col === null) { mapping[sem] = null; continue; }
    col = String(col);
    if (headerSet.has(col)) { mapping[sem] = col; continue; }
    const alt = normToActual.get(normHeader(col));
    if (alt) { mapping[sem] = alt; continue; }
    errors.push(sem);
  }
  return { mapping, suggested, errors };
}

function normalizeRows(header, rows, mapping, filter) {
  const idx = {};
  for (const sem of SEMANTICS) {
    const col = mapping[sem];
    idx[sem] = col ? header.indexOf(col) : -1;
  }
  let filterIdx = -1;
  let filterVal = null;
  if (filter && filter.column) {
    filterIdx = header.indexOf(String(filter.column));
    if (filterIdx === -1) {
      const alt = header.find((h) => normHeader(h) === normHeader(String(filter.column)));
      if (alt) filterIdx = header.indexOf(alt);
    }
    filterVal = filter.value == null ? '' : String(filter.value).trim();
  }

  const out = [];
  const dateFormats = new Set();
  let rowsDiscarded = 0;
  let parseErrors = 0;
  const seenNames = new Set();
  const duplicateNames = new Set();
  const prices = [];

  for (let i = 0; i < rows.length; i++) {
    const rawArr = rows[i];
    if (rawArr.every((c) => capCell(c).trim() === '')) continue;

    if (filterIdx >= 0) {
      const cell = capCell(rawArr[filterIdx]).trim();
      if (cell !== filterVal) { rowsDiscarded++; continue; }
    }

    const raw = {};
    for (let c = 0; c < header.length; c++) raw[header[c]] = capCell(rawArr[c]);

    const parsed = {
      product_id: null, product_name: null, category: null,
      stock: null, reorder_level: null, reorder_quantity: null,
      unit_price: null, unit_cost: null, units_sold: null,
      expiry_date: null, received_date: null, last_order_date: null,
      lead_time_days: null,
    };
    const issues = [];
    let rowHadError = false;

    if (idx.product_id >= 0) {
      const v = capCell(rawArr[idx.product_id]).trim();
      parsed.product_id = v || null;
    }
    if (idx.product_name >= 0) {
      const v = capCell(rawArr[idx.product_name]).trim();
      parsed.product_name = v || null;
    }
    if (idx.category >= 0) {
      const v = capCell(rawArr[idx.category]).trim();
      parsed.category = v || null;
      if (!v) issues.push('missing_category');
    }

    const numFields = [
      ['stock', 'invalid_stock'],
      ['reorder_level', 'invalid_number'],
      ['reorder_quantity', 'invalid_number'],
      ['unit_price', 'invalid_price'],
      ['unit_cost', 'invalid_number'],
      ['units_sold', 'invalid_number'],
      ['lead_time_days', 'invalid_number'],
    ];
    for (const [field, code] of numFields) {
      if (idx[field] < 0) continue;
      const r = parseNumber(rawArr[idx[field]]);
      if (!r.ok) {
        issues.push(code);
        if (code === 'invalid_price' || code === 'invalid_stock') rowHadError = true;
      } else {
        parsed[field] = r.value;
      }
    }
    if (parsed.unit_price != null) prices.push(parsed.unit_price);

    const dateFields = [
      ['expiry_date', 'invalid_date'],
      ['received_date', 'invalid_date'],
      ['last_order_date', 'invalid_date'],
    ];
    for (const [field, code] of dateFields) {
      if (idx[field] < 0) continue;
      const r = parseDate(rawArr[idx[field]]);
      if (!r.ok) {
        issues.push(code);
        rowHadError = true;
      } else {
        parsed[field] = r.value;
        if (r.format) dateFormats.add(r.format);
      }
    }

    if (parsed.expiry_date && parsed.received_date && parsed.expiry_date < parsed.received_date) {
      issues.push('exp_before_received');
    }
    if (parsed.last_order_date && parsed.received_date && parsed.last_order_date < parsed.received_date) {
      issues.push('last_order_before_received');
    }

    if (parsed.product_name) {
      const key = parsed.product_name.trim().toLowerCase();
      if (seenNames.has(key)) {
        if (!duplicateNames.has(key)) duplicateNames.add(key);
        issues.push('duplicate_product_name');
      } else {
        seenNames.add(key);
      }
    }

    if (issues.includes('invalid_price')) parseErrors++;

    out.push({
      row_number: out.length + 1,
      raw,
      parsed,
      issues,
      _hadError: rowHadError,
    });
  }

  if (prices.length) {
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    for (const row of out) {
      if (row.parsed.unit_price != null && row.parsed.unit_price > 50 && row.parsed.unit_price > median * 3) {
        if (!row.issues.includes('price_outlier')) row.issues.push('price_outlier');
      }
    }
  }

  return {
    rows: out,
    rows_matched: out.length,
    rows_discarded: rowsDiscarded,
    parse_errors: parseErrors,
    date_formats: [...dateFormats],
    duplicate_name_count: duplicateNames.size,
  };
}

function buildProfile(header, normalized, mapping, uploadMeta) {
  const rows = normalized.rows;
  const colStats = header.map((h) => {
    let nulls = 0;
    const distinct = new Set();
    let min = null, max = null, numSum = 0, numCount = 0;
    for (const r of rows) {
      const v = r.raw[h];
      if (v == null || v === '') { nulls++; continue; }
      if (distinct.size <= 500) distinct.add(v);
      const num = parseNumber(v);
      if (num.ok && num.value != null) {
        numSum += num.value; numCount++;
        if (min == null || num.value < min) min = num.value;
        if (max == null || num.value > max) max = num.value;
      } else {
        const d = parseDate(v);
        if (d.ok && d.value) {
          if (min == null || d.value < min) min = d.value;
          if (max == null || d.value > max) max = d.value;
        }
      }
    }
    return {
      name: h,
      null_count: nulls,
      distinct_count: distinct.size,
      min: min,
      max: max,
      avg: numCount ? Math.round((numSum / numCount) * 100) / 100 : null,
    };
  });

  const issueCounts = {};
  let rowsWithIssues = 0;
  for (const r of rows) {
    if (r.issues.length) rowsWithIssues++;
    for (const code of r.issues) issueCounts[code] = (issueCounts[code] || 0) + 1;
  }

  const catCol = mapping.category;
  const categoryCounts = {};
  if (catCol) {
    for (const r of rows) {
      const c = r.parsed.category || '(blank)';
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    }
  }

  let allDates = [];
  for (const r of rows) {
    for (const f of ['expiry_date', 'received_date', 'last_order_date']) {
      if (r.parsed[f]) allDates.push(r.parsed[f]);
    }
  }
  allDates.sort();

  const priceVals = rows.map((r) => r.parsed.unit_price).filter((v) => v != null).sort((a, b) => a - b);
  const stockBelowReorder = rows.filter(
    (r) => r.parsed.stock != null && r.parsed.reorder_level != null && r.parsed.stock < r.parsed.reorder_level
  ).length;

  return {
    row_count: rows.length,
    column_count: header.length,
    header,
    mapping,
    date_formats: normalized.date_formats,
    date_range: allDates.length ? { min: allDates[0], max: allDates[allDates.length - 1] } : null,
    issue_counts: issueCounts,
    rows_with_issues: rowsWithIssues,
    rows_discarded: normalized.rows_discarded,
    parse_errors: normalized.parse_errors,
    duplicate_name_count: normalized.duplicate_name_count,
    columns: colStats,
    categories: categoryCounts,
    category_count: Object.keys(categoryCounts).length,
    price: priceVals.length ? {
      min: priceVals[0],
      max: priceVals[priceVals.length - 1],
      median: priceVals[Math.floor(priceVals.length / 2)],
      outliers_over_50: priceVals.filter((v) => v > 50).length,
    } : null,
    stock_below_reorder: stockBelowReorder,
    upload: uploadMeta || null,
  };
}

module.exports = {
  SEMANTICS,
  normHeader,
  capCell,
  parseNumber,
  parseDate,
  suggestMapping,
  resolveMapping,
  normalizeRows,
  buildProfile,
};
