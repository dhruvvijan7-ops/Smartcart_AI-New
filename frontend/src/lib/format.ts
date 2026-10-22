const intFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const decFmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const moneyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})
const moneyPreciseFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmtInt(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return intFmt.format(n)
}

export function fmtNum(value: unknown, digits = 2): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (digits === 0) return intFmt.format(n)
  return decFmt.format(n)
}

export function fmtCompact(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 10000000) return (n / 10000000).toFixed(1).replace(/\.0$/, '') + ' Cr'
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + ' L'
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return intFmt.format(n)
}

export function fmtMoney(value: unknown, precise = false): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return (precise ? moneyPreciseFmt : moneyFmt).format(n)
}

export function fmtMoneyCompact(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1000) return '₹' + fmtCompact(n)
  return moneyFmt.format(n)
}

export function fmtPct(value: unknown, digits = 1): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits).replace(/\.0$/, '') + '%'
}

export function fmtDate(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDateTime(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  )
}

export function fmtRelative(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (Math.abs(mins) < 1) return 'just now'
  if (Math.abs(mins) < 60) return (mins > 0 ? mins + ' min ago' : Math.abs(mins) + ' min from now')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return (hours > 0 ? hours + ' h ago' : Math.abs(hours) + ' h from now')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return (days > 0 ? days + ' d ago' : Math.abs(days) + ' d from now')
  return fmtDate(value)
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'SC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function pluralize(n: number, one: string, many = one + 's'): string {
  return n === 1 ? one : many
}

export function bytesToSize(bytes: unknown): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(2) + ' MB'
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function objectToCsvRows(obj: Record<string, unknown> | null | undefined): Record<string, unknown>[] {
  if (!obj) return []
  return Object.entries(obj).map(([key, value]) => ({ key, value }))
}
