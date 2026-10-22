import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { auditApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import { PageHeader } from '../components/ui/PageHeader'
import { DegradedBanner, EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'
import { fmtDateTime } from '../lib/format'

interface AuditRow {
  id?: number
  action_type?: string
  entity?: string
  entity_id?: number | string
  details?: unknown
  created_at?: string
}

export default function AuditTrail() {
  const { data, error, loading, reload } = useApi<AuditRow[]>(() => auditApi.getAll(), [], {
    validate: Array.isArray,
  })

  const rows = data || []
  const looksLikeAudit = rows.length > 0 && rows.some((r) => r.action_type != null || r.created_at != null)
  const mockDetected = rows.length > 0 && !looksLikeAudit

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="A chronological record of dataset and workspace operations."
      />

      {loading ? <TableSkeleton rows={6} cols={4} /> : null}

      {!loading && error ? (
        <ErrorState title="Audit log could not be loaded" description={error} onRetry={reload} />
      ) : null}

      {!loading && !error && mockDetected ? (
        <DegradedBanner title="The audit endpoint is returning the wrong dataset" onRetry={reload}>
          <code>/api/audit</code> responded with {rows.length} product-shaped records that contain no{' '}
          <code>action_type</code> or <code>created_at</code> fields. This is a known server-side defect (a
          multi-statement SQL bug makes the route fall back to a products query). SmartCart AI will not render
          product rows as if they were audit events.
        </DegradedBanner>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="No audit events yet"
          description="Operations such as dataset uploads and store deletions will appear here once the backend records them."
        />
      ) : null}

      {!loading && !error && looksLikeAudit ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? i}>
                    <td>{fmtDateTime(r.created_at)}</td>
                    <td style={{ fontWeight: 600 }}>{r.action_type || '—'}</td>
                    <td>{r.entity || '—'}</td>
                    <td className="text-secondary" style={{ fontSize: '0.84rem' }}>
                      {r.details ? JSON.stringify(r.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 && !mockDetected ? (
        <div className="text-faint" style={{ marginTop: 14, fontSize: '0.78rem' }}>
          <TriangleAlert size={11} aria-hidden="true" style={{ verticalAlign: '-1px' }} /> Showing the most recent{' '}
          {rows.length} events returned by the API.
        </div>
      ) : null}
    </div>
  )
}
