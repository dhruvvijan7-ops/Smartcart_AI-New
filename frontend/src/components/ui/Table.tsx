import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  align?: 'left' | 'right'
  width?: string
  sortable?: boolean
  sortKey?: string
  headerTitle?: string
}

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  caption,
  minWidth = 640,
  rowClassName,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string | number
  sort?: SortState
  onSortChange?: (s: SortState) => void
  caption?: ReactNode
  minWidth?: number
  rowClassName?: (row: T) => string
}) {
  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return
    const key = col.sortKey || col.key
    const dir: 'asc' | 'desc' = sort && sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc'
    onSortChange({ key, dir })
  }

  return (
    <div className="table-wrap">
      <table className="table" style={{ minWidth }}>
        {caption ? <caption className="table-caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => {
              const key = col.sortKey || col.key
              const active = sort && sort.key === key
              return (
                <th
                  key={col.key}
                  className={`${col.align === 'right' ? 'num' : ''} ${col.sortable ? 'sortable' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  title={col.headerTitle}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  onClick={() => handleSort(col)}
                >
                  {col.sortable ? (
                    <span className="row" style={{ gap: 5, display: 'inline-flex' }}>
                      {col.header}
                      {active ? (
                        sort!.dir === 'asc' ? (
                          <ArrowUp size={12} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={12} aria-hidden="true" />
                        )
                      ) : null}
                    </span>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)} className={rowClassName?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className={col.align === 'right' ? 'num' : undefined}>
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  label = 'rows',
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  label?: string
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  const pages: (number | 'gap')[] = []
  const push = (p: number | 'gap') => pages.push(p)
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) push(i)
  } else {
    push(1)
    if (page > 3) push('gap')
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) push(i)
    if (page < pageCount - 2) push('gap')
    push(pageCount)
  }

  return (
    <div className="pagination">
      <span className="status" aria-live="polite">
        {total === 0 ? `No ${label}` : `${from}–${to} of ${total} ${label}`}
      </span>
      <div className="pages">
        {onPageSizeChange ? (
          <label className="status row" style={{ gap: 6, marginRight: 8 }}>
            <span className="sr-only">Rows per page</span>
            <select
              className="select"
              style={{ padding: '5px 28px 5px 8px', fontSize: '0.8rem' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="text-faint" style={{ padding: '0 2px' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              className="page-btn"
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
