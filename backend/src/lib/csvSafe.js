'use strict';

function sanitizeCell(v) {
  let s = v == null ? '' : String(v);
  s = s.replace(/\0/g, '');
  if (s.length > 512) s = s.slice(0, 512);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsvLine(values) {
  return values.map(sanitizeCell).join(',') + '\r\n';
}

function sanitizeFilename(name) {
  const base = String(name || 'export').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return base.toLowerCase().endsWith('.csv') ? base : base + '.csv';
}

module.exports = { sanitizeCell, toCsvLine, sanitizeFilename };
