import { Link } from 'react-router-dom'
import { BellRing, Database, ShieldCheck, ShoppingCart, TriangleAlert } from 'lucide-react'
import { compareApi, storesApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import type { ComparePayload, StoreRecord } from '../lib/types'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner, EmptyState, ErrorState } from '../components/ui/States'
import { StatusBadge } from '../components/ui/Metrics'
import { fmtInt } from '../lib/format'

interface Alert {
  id: string
  tone: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  to: string
}

export default function Alerts() {
  const storesQ = useApi<StoreRecord[]>(() => storesApi.getAll(), [], { validate: Array.isArray })
  const compareQ = useApi<ComparePayload>(() => compareApi.getAll(), [], {
    validate: (d): d is ComparePayload => typeof d === 'object' && d !== null && Array.isArray((d as ComparePayload).stores),
  })

  const stores = storesQ.data || []
  const alerts: Alert[] = []

  for (const s of stores) {
    if (!s.active_upload_id) {
      alerts.push({
        id: `nodata-${s.id}`,
        tone: 'info',
        title: `“${s.name}” has no dataset`,
        detail: 'Expiry, sales and reorder analytics are switched off for this store until a file is uploaded.',
        to: `/upload?store_id=${s.id}`,
      })
    }
  }

  for (const s of compareQ.data?.stores || []) {
    if ((s.total_expired_rows || 0) > 0) {
      alerts.push({
        id: `exp-${s.store_id}`,
        tone: 'critical',
        title: `${fmtInt(s.total_expired_rows)} expired rows in “${s.name}”`,
        detail: 'Rows whose expiry date falls before the analysis anchor date. Open the store’s Expiry tab for the breakdown.',
        to: `/stores/${s.store_id}?tab=expiry`,
      })
    }
    if ((s.items_to_order || 0) > 0) {
      alerts.push({
        id: `ord-${s.store_id}`,
        tone: 'warning',
        title: `${fmtInt(s.items_to_order)} items below reorder point in “${s.name}”`,
        detail: `${fmtInt(s.total_order_units)} units recommended${
          s.total_est_cost != null ? ` · approx. ₹${fmtInt(s.total_est_cost)}` : ''
        }.`,
        to: `/stores/${s.store_id}?tab=orders`,
      })
    }
  }

  const order = { critical: 0, warning: 1, info: 2 } as const
  alerts.sort((a, b) => order[a.tone] - order[b.tone])

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Derived from your stores' live metrics: expired stock, reorder recommendations and stores without datasets."
      />

      <div className="degraded-banner info" style={{ marginBottom: 18 }} role="note">
        <BellRing size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
        <div>
          <strong>About notification push events</strong>
          <div style={{ marginTop: 3 }}>
            The backend's <code>/api/notifications</code> endpoint is currently non-functional in this deployment
            (it returns an empty body). Rather than showing a fake notification centre, this page derives alerts
            from real store metrics each time you open it.
          </div>
        </div>
      </div>

      {storesQ.loading || compareQ.loading ? <CardSkeleton count={3} /> : null}

      {storesQ.error && !storesQ.data ? (
        <ErrorState title="Stores could not be loaded" description={storesQ.error} onRetry={storesQ.reload} />
      ) : null}

      {!storesQ.loading && storesQ.error && storesQ.data ? (
        <div style={{ marginBottom: 14 }}>
          <DegradedBanner title="Some store data is stale" onRetry={storesQ.reload} tone="info">
            {storesQ.error}
          </DegradedBanner>
        </div>
      ) : null}

      {compareQ.error ? (
        <div style={{ marginBottom: 14 }}>
          <DegradedBanner title="Metrics comparison unavailable" onRetry={compareQ.reload}>
            {compareQ.error} Expiry and reorder alerts cannot be computed until this endpoint responds.
          </DegradedBanner>
        </div>
      ) : null}

      {!storesQ.loading && alerts.length === 0 && !compareQ.loading ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="Nothing needs attention"
          description="Every store has a dataset, no expired rows were found, and no items are below their reorder point."
          action={
            <Link to="/stores" className="btn btn-secondary">
              Review stores
            </Link>
          }
        />
      ) : null}

      {alerts.length > 0 ? (
        <div className="stack" style={{ gap: 10 }}>
          {alerts.map((a) => (
            <Link
              key={a.id}
              to={a.to}
              className="card card-pad row"
              style={{ gap: 14, alignItems: 'flex-start', textDecoration: 'none' }}
            >
              <span
                className="store-avatar"
                aria-hidden="true"
                style={
                  a.tone === 'critical'
                    ? { background: 'var(--critical-soft)', color: 'var(--critical)' }
                    : a.tone === 'warning'
                      ? { background: 'var(--warning-soft)', color: 'var(--warning)' }
                      : undefined
                }
              >
                {a.tone === 'info' ? <Database size={17} /> : a.tone === 'critical' ? <TriangleAlert size={17} /> : <ShoppingCart size={17} />}
              </span>
              <span className="min-w-0" style={{ flex: 1 }}>
                <span className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <strong>{a.title}</strong>
                  <StatusBadge tone={a.tone === 'critical' ? 'critical' : a.tone === 'warning' ? 'warning' : 'info'}>
                    {a.tone}
                  </StatusBadge>
                </span>
                <span className="text-secondary" style={{ display: 'block', fontSize: '0.86rem', marginTop: 4, lineHeight: 1.55 }}>
                  {a.detail}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <SectionHeading
          title="How these are computed"
          description="Each alert is rebuilt from /api/stores and /api/compare on page load. Dismissing is not possible because there is no server-side alert store in this deployment."
        />
      ) : null}
    </div>
  )
}
