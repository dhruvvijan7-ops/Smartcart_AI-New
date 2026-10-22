import { ClipboardList, TriangleAlert } from 'lucide-react'
import { suppliersApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import { PageHeader } from '../components/ui/PageHeader'
import { DegradedBanner, EmptyState, TableSkeleton } from '../components/ui/States'

interface SupplierRow {
  id?: number
  name?: string
  contact?: string
  reliability?: number
  [k: string]: unknown
}

export default function Suppliers() {
  const { data, error, loading, reload } = useApi<SupplierRow[]>(() => suppliersApi.getAll(), [], {
    validate: Array.isArray,
  })

  const rows = data || []
  const shaped = rows.length > 0 && rows.some((r) => r.name != null)
  const malformed = rows.length > 0 && !shaped

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Vendor records linked to catalog products." />

      {loading ? <TableSkeleton rows={5} cols={4} /> : null}

      {!loading && error ? (
        <DegradedBanner title="The suppliers endpoint is not functioning" onRetry={reload}>
          <code>/api/suppliers</code> failed to respond with usable data: {error} This is a known server-side defect
          (the route's SQL uses a multi-statement query pattern that returns an empty body). Supplier data cannot be
          shown until the backend is fixed — SmartCart AI will not substitute placeholder vendors.
          <div style={{ marginTop: 10 }}>
            <span className="row" style={{ gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <TriangleAlert size={13} aria-hidden="true" /> Product rows still carry a supplier name where the
              products join succeeds — see the Inventory page.
            </span>
          </div>
        </DegradedBanner>
      ) : null}

      {!loading && !error && malformed ? (
        <DegradedBanner title="Unexpected payload from /api/suppliers" onRetry={reload}>
          The endpoint returned {rows.length} rows, but they do not look like supplier records.
        </DegradedBanner>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={20} />}
          title="No suppliers recorded"
          description="Supplier records are managed on the server. None were returned by the API."
        />
      ) : null}

      {!loading && !error && shaped ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th className="num">Reliability</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.id ?? i}>
                    <td>{s.id ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{s.name || '—'}</td>
                    <td>{s.contact ?? '—'}</td>
                    <td className="num">{s.reliability ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
