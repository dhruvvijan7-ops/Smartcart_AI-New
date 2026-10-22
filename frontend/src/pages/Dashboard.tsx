import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Scale,
  ShoppingCart,
  Sparkles,
  Store as StoreIcon,
  TriangleAlert,
  Upload as UploadIcon,
  Wallet,
} from 'lucide-react'
import { aiApi, compareApi, dashboardApi, storesApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import type { ComparePayload, StoreRecord } from '../lib/types'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner } from '../components/ui/States'
import { StatCard, StatusBadge } from '../components/ui/Metrics'
import { fmtCompact, fmtInt, fmtRelative } from '../lib/format'

interface KpiPayload {
  kpis?: {
    totalItems?: number
    criticalCount?: number
    highCount?: number
    warningCount?: number
    potentialSavings?: string
    unreadNotifications?: number
    wasteReductionPct?: string
  }
  wasteTrend?: { date: string; total_wasted: number; total_loss: number }[]
}

interface MineRules {
  algorithm?: string
  total_rules?: number
  total_transactions?: number
  min_support?: number
  min_confidence?: number
  rules?: {
    readable_rule?: string
    support?: number
    confidence?: number
    lift?: number
    prescriptive_action?: string
  }[]
}

interface Heatmap {
  algorithm?: string
  zones?: {
    zone: string
    name: string
    item_count: number
    avg_expiry_days: number
    stock_qty: number
    cluster_name: string
    color: string
  }[]
}

export default function Dashboard() {
  const kpisQ = useApi<KpiPayload>(() => dashboardApi.getKpis(), [], {
    validate: (d): d is KpiPayload => typeof d === 'object' && d !== null && 'kpis' in d,
  })
  const storesQ = useApi<StoreRecord[]>(() => storesApi.getAll(), [], { validate: Array.isArray })
  const compareQ = useApi<ComparePayload>(() => compareApi.getAll(), [], {
    validate: (d): d is ComparePayload => typeof d === 'object' && d !== null && Array.isArray((d as ComparePayload).stores),
  })
  const rulesQ = useApi<MineRules>(() => aiApi.mineRules(), [], {
    validate: (d): d is MineRules => typeof d === 'object' && d !== null && 'rules' in d,
  })
  const heatQ = useApi<Heatmap>(() => aiApi.getHeatmap(), [], {
    validate: (d): d is Heatmap => typeof d === 'object' && d !== null && Array.isArray((d as Heatmap).zones),
  })

  const k = kpisQ.data?.kpis
  const stores = storesQ.data || []
  const withData = stores.filter((s) => s.active_upload_id)
  const attention = (compareQ.data?.stores || []).filter((s) => (s.total_expired_rows || 0) > 0 || (s.items_to_order || 0) > 0)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Workspace overview: catalog risk signals, store network health and the intelligence engine's latest output."
        actions={
          <>
            <Link to="/compare" className="btn btn-secondary">
              <Scale size={16} aria-hidden="true" /> Compare stores
            </Link>
            <Link to="/upload" className="btn btn-accent">
              <UploadIcon size={16} aria-hidden="true" /> Upload dataset
            </Link>
          </>
        }
      />

      {/* Catalog KPIs */}
      {kpisQ.loading ? (
        <CardSkeleton count={4} />
      ) : kpisQ.error ? (
        <DegradedBanner title="Catalog KPIs are unavailable" onRetry={kpisQ.reload}>
          {kpisQ.error}
        </DegradedBanner>
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard
              label="Units in catalog"
              value={fmtInt(k?.totalItems)}
              note="Sum of stock across oltp.products"
              icon={<Boxes size={16} />}
            />
            <StatCard
              label="Critical risk"
              value={fmtInt(k?.criticalCount)}
              note={`${fmtInt(k?.highCount)} high · ${fmtInt(k?.warningCount)} warning`}
              tone="bad"
              icon={<TriangleAlert size={16} />}
            />
            <StatCard
              label="Potential savings"
              value={k?.potentialSavings ? `₹${k.potentialSavings}` : '—'}
              note="25% markdown applied to catalog stock"
              tone="coral"
              icon={<Wallet size={16} />}
            />
            <StatCard
              label="Open items to order"
              value={fmtInt(
                (compareQ.data?.stores || []).reduce((a, s) => a + (s.items_to_order || 0), 0),
              )}
              note="Across all stores with datasets"
              tone="brand"
              icon={<ShoppingCart size={16} />}
            />
          </div>
          <div className="text-faint" style={{ fontSize: '0.76rem', marginTop: 8 }}>
            Catalog KPIs and the waste trend are computed live from <code>oltp.stock</code>,{' '}
            <code>oltp.products</code> and <code>warehouse.fact_waste_events</code>.
          </div>
        </>
      )}

      {/* Store network */}
      <div style={{ marginTop: 22 }}>
        <SectionHeading
          title="Store network"
          description={
            stores.length
              ? `${withData.length} of ${stores.length} stores have an active dataset.`
              : 'Stores you manage in this workspace.'
          }
          actions={
            <Link to="/stores" className="btn btn-secondary btn-sm">
              All stores <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        />
        {storesQ.loading ? (
          <div style={{ marginTop: 12 }}>
            <CardSkeleton count={3} />
          </div>
        ) : storesQ.error ? (
          <div style={{ marginTop: 12 }}>
            <DegradedBanner title="Stores could not be loaded" onRetry={storesQ.reload}>
              {storesQ.error}
            </DegradedBanner>
          </div>
        ) : stores.length === 0 ? (
          <div style={{ marginTop: 12 }}>
            <DegradedBanner title="No stores yet" tone="info">
              <Link to="/stores/new" className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>
                <StoreIcon size={14} aria-hidden="true" /> Create your first store
              </Link>
            </DegradedBanner>
          </div>
        ) : (
          <div className="grid grid-3" style={{ marginTop: 12 }}>
            {stores.slice(0, 6).map((s) => (
              <Link key={s.id} to={`/stores/${s.id}`} className="card card-pad store-card">
                <div className="row-between">
                  <span className="store-avatar" aria-hidden="true">
                    <StoreIcon size={17} />
                  </span>
                  {s.active_upload_id ? (
                    <StatusBadge tone="success">Dataset #{s.active_upload_id}</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">No dataset</StatusBadge>
                  )}
                </div>
                <h3 style={{ marginTop: 12, fontSize: '1rem' }}>{s.name}</h3>
                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {s.city || 'Location not set'} · lead {s.lead_time_days} d
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Attention list + waste trend */}
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <div className="card card-pad">
          <SectionHeading title="Needs attention" description="Stores with expired stock or open reorder recommendations." />
          {compareQ.loading ? (
            <div style={{ marginTop: 12 }}>
              <CardSkeleton count={1} />
            </div>
          ) : compareQ.error ? (
            <div style={{ marginTop: 12 }}>
              <DegradedBanner title="Comparison metrics unavailable" onRetry={compareQ.reload}>
                {compareQ.error}
              </DegradedBanner>
            </div>
          ) : attention.length === 0 ? (
            <p className="text-faint" style={{ marginTop: 12, fontSize: '0.88rem' }}>
              Nothing flagged — either no datasets are attached yet, or every store is within its reorder and expiry
              thresholds.
            </p>
          ) : (
            <div className="stack" style={{ gap: 10, marginTop: 14 }}>
              {attention.map((s) => (
                <Link key={s.store_id} to={`/stores/${s.store_id}`} className="row-between" style={{ gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span className="min-w-0">
                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                    <span className="text-faint" style={{ display: 'block', fontSize: '0.76rem' }}>
                      {s.city || ''}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(s.total_expired_rows || 0) > 0 ? (
                      <StatusBadge tone="critical">{fmtInt(s.total_expired_rows)} expired</StatusBadge>
                    ) : null}
                    {(s.items_to_order || 0) > 0 ? (
                      <StatusBadge tone="warning">{fmtInt(s.items_to_order)} to order</StatusBadge>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <SectionHeading title="Waste trend" description="Daily wasted quantity from the analytics warehouse." />
          <div style={{ height: 220, marginTop: 12 }}>
            {kpisQ.data?.wasteTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpisQ.data.wasteTrend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef8557" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ef8557" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total_wasted" stroke="#ef8557" strokeWidth={2.5} fill="url(#wasteFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-faint">No trend series returned.</p>
            )}
          </div>
          <div className="text-faint" style={{ fontSize: '0.74rem', marginTop: 8 }}>
            Aggregated from <code>warehouse.fact_waste_events</code>. Per-store expiry analytics live on each store
            page.
          </div>
        </div>
      </div>

      {/* Intelligence engine */}
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <div className="card card-pad">
          <SectionHeading
            title="Spoilage association rules"
            description={rulesQ.data?.algorithm ? `Computed by ${rulesQ.data.algorithm}` : 'From the rule-mining endpoint.'}
            actions={
              <Link to="/insights" className="btn btn-secondary btn-sm">
                <Sparkles size={14} aria-hidden="true" /> All insights
              </Link>
            }
          />
          {rulesQ.loading ? (
            <div style={{ marginTop: 12 }}>
              <CardSkeleton count={1} />
            </div>
          ) : rulesQ.error ? (
            <div style={{ marginTop: 12 }}>
              <DegradedBanner title="Rule mining is unavailable" onRetry={rulesQ.reload}>
                {rulesQ.error}
              </DegradedBanner>
            </div>
          ) : (rulesQ.data?.rules || []).length === 0 ? (
            <p className="text-faint" style={{ marginTop: 12, fontSize: '0.88rem' }}>
              No rules mined yet — the engine needs spoilage transactions to work with.
            </p>
          ) : (
            <div className="stack" style={{ gap: 10, marginTop: 14 }}>
              {(rulesQ.data!.rules || []).slice(0, 3).map((r, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.readable_rule}</div>
                  <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className="chip">support {Math.round((r.support ?? 0) * 100)}%</span>
                    <span className="chip">confidence {Math.round((r.confidence ?? 0) * 100)}%</span>
                    <span className="chip">lift {r.lift ?? '—'}</span>
                  </div>
                  {r.prescriptive_action ? (
                    <div className="text-secondary" style={{ fontSize: '0.8rem', marginTop: 6 }}>
                      {r.prescriptive_action}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <SectionHeading
            title="Zone risk clusters"
            description={heatQ.data?.algorithm ? `Clustered with ${heatQ.data.algorithm}` : 'From the heatmap endpoint.'}
          />
          {heatQ.loading ? (
            <div style={{ marginTop: 12 }}>
              <CardSkeleton count={1} />
            </div>
          ) : heatQ.error ? (
            <div style={{ marginTop: 12 }}>
              <DegradedBanner title="Zone heatmap is unavailable" onRetry={heatQ.reload}>
                {heatQ.error}
              </DegradedBanner>
            </div>
          ) : (heatQ.data?.zones || []).length === 0 ? (
            <p className="text-faint" style={{ marginTop: 12, fontSize: '0.88rem' }}>No zone data available.</p>
          ) : (
            <div className="stack" style={{ gap: 8, marginTop: 14 }}>
              {heatQ.data!.zones!.map((z) => (
                <div key={z.zone} className="row-between" style={{ gap: 10, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span className="row" style={{ gap: 8, minWidth: 0 }}>
                    <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: z.color, flex: 'none' }} />
                    <span className="truncate" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                      {z.zone} · {z.name}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 8, fontSize: '0.78rem' }}>
                    <span className="text-secondary">{fmtInt(z.item_count)} items</span>
                    <span className="text-secondary">{fmtCompact(z.stock_qty)} u</span>
                    <StatusBadge tone={z.cluster_name.includes('Low') ? 'good' : z.cluster_name.includes('High') ? 'warning' : 'critical'} dot={false}>
                      {z.cluster_name}
                    </StatusBadge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-faint" style={{ marginTop: 20, fontSize: '0.76rem' }}>
        <AlertTriangle size={11} aria-hidden="true" style={{ verticalAlign: '-1px' }} /> Catalog KPIs refresh on each
        page load. Store metrics recompute when datasets change.
        {compareQ.data?.computed_at ? ` · store metrics computed ${fmtRelative(compareQ.data.computed_at)}` : ''}
      </div>
    </div>
  )
}
