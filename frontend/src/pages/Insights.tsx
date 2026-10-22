import { useState } from 'react'
import { FlaskConical, RefreshCw, Sparkles, TriangleAlert, Workflow } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiApi, apiErrorMessage } from '../lib/api'
import { useApi, useQueryParam } from '../lib/hooks'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner, EmptyState } from '../components/ui/States'
import { StatCard, StatusBadge } from '../components/ui/Metrics'
import Button from '../components/ui/Button'
import { fmtInt, fmtNum } from '../lib/format'

interface Rule {
  antecedents?: string[]
  consequents?: string[]
  support?: number
  confidence?: number
  lift?: number
  conviction?: number
  readable_rule?: string
  root_cause_diagnosis?: string
  prescriptive_action?: string
}

interface MineRulesPayload {
  algorithm?: string
  min_support?: number
  min_confidence?: number
  min_lift?: number
  total_transactions?: number
  total_rules?: number
  rules?: Rule[]
}

interface HeatmapPayload {
  algorithm?: string
  zones?: {
    zone: string
    name: string
    item_count: number
    avg_expiry_days: number
    stock_qty: number
    cluster_id?: number
    cluster_name: string
    color: string
  }[]
}

export default function Insights() {
  const [tab, setTab] = useQueryParam('tab', 'rules')
  const [mining, setMining] = useState(false)

  const rulesQ = useApi<MineRulesPayload>(() => aiApi.mineRules(), [], {
    validate: (d): d is MineRulesPayload => typeof d === 'object' && d !== null && 'rules' in d,
  })
  const heatQ = useApi<HeatmapPayload>(() => aiApi.getHeatmap(), [], {
    validate: (d): d is HeatmapPayload => typeof d === 'object' && d !== null && Array.isArray((d as HeatmapPayload).zones),
  })

  const remine = async () => {
    setMining(true)
    try {
      await aiApi.postMineRules({})
      toast.success('Rules re-mined from current spoilage data')
      rulesQ.reload()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Rule mining failed.'))
    } finally {
      setMining(false)
    }
  }

  const rules = rulesQ.data?.rules || []
  const zones = heatQ.data?.zones || []

  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Machine-mined spoilage associations and zone risk clusters computed by the SmartCart AI engine."
        actions={
          <Button variant="secondary" loading={mining} icon={<RefreshCw size={15} />} onClick={() => void remine()}>
            Re-mine rules
          </Button>
        }
      />

      <div className="tabs" role="tablist" aria-label="Insight views">
        <button role="tab" aria-selected={tab === 'rules'} className={`tab ${tab === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')} type="button">
          <Workflow size={15} aria-hidden="true" /> Association rules
        </button>
        <button role="tab" aria-selected={tab === 'zones'} className={`tab ${tab === 'zones' ? 'active' : ''}`} onClick={() => setTab('zones')} type="button">
          <FlaskConical size={15} aria-hidden="true" /> Zone clusters
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === 'rules' ? (
          <div className="stack" style={{ gap: 16 }}>
            {rulesQ.loading ? <CardSkeleton count={2} /> : null}
            {rulesQ.error ? (
              <DegradedBanner title="Rule mining is unavailable" onRetry={rulesQ.reload}>
                {rulesQ.error} The <code>/api/ai/mine-rules</code> endpoint could not be reached or returned an
                unexpected payload.
              </DegradedBanner>
            ) : null}

            {!rulesQ.loading && !rulesQ.error ? (
              <>
                <div className="grid grid-4">
                  <StatCard label="Rules mined" value={fmtInt(rulesQ.data?.total_rules)} note={rulesQ.data?.algorithm || '—'} icon={<Workflow size={16} />} />
                  <StatCard label="Transactions" value={fmtInt(rulesQ.data?.total_transactions)} note="Spoilage events analysed" tone="brand" />
                  <StatCard
                    label="Min support"
                    value={rulesQ.data?.min_support != null ? fmtNum(rulesQ.data.min_support * 100, 0) + '%' : '—'}
                    note="Frequent-itemset threshold"
                    tone="ok"
                  />
                  <StatCard
                    label="Min confidence"
                    value={rulesQ.data?.min_confidence != null ? fmtNum(rulesQ.data.min_confidence * 100, 0) + '%' : '—'}
                    note="Rule confidence floor"
                    tone="coral"
                  />
                </div>

                {rules.length === 0 ? (
                  <EmptyState
                    icon={<Sparkles size={20} />}
                    title="No association rules yet"
                    description="The Apriori engine needs spoilage transactions in the database. Upload datasets that include expiry dates and generate activity, then re-mine."
                    action={
                      <Button variant="secondary" loading={mining} onClick={() => void remine()}>
                        Try mining now
                      </Button>
                    }
                  />
                ) : (
                  rules.map((r, i) => (
                    <div className="card card-pad" key={i}>
                      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1rem' }}>{r.readable_rule || `${(r.antecedents || []).join(', ')} → ${(r.consequents || []).join(', ')}`}</h3>
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <span className="chip">support {Math.round((r.support ?? 0) * 100)}%</span>
                          <span className="chip">confidence {Math.round((r.confidence ?? 0) * 100)}%</span>
                          <span className="chip chip-on">lift {r.lift ?? '—'}</span>
                          {r.conviction != null ? <span className="chip">conviction {fmtInt(r.conviction)}</span> : null}
                        </div>
                      </div>
                      {r.root_cause_diagnosis ? (
                        <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Root cause:</strong> {r.root_cause_diagnosis}
                        </p>
                      ) : null}
                      {r.prescriptive_action ? (
                        <div className="tint-panel" style={{ marginTop: 10, fontSize: '0.86rem' }}>
                          <strong>Prescriptive action:</strong> {r.prescriptive_action}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </>
            ) : null}
          </div>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            {heatQ.loading ? <CardSkeleton count={2} /> : null}
            {heatQ.error ? (
              <DegradedBanner title="Zone heatmap is unavailable" onRetry={heatQ.reload}>
                {heatQ.error}
              </DegradedBanner>
            ) : null}

            {!heatQ.loading && !heatQ.error ? (
              <>
                <div className="grid grid-3">
                  <StatCard label="Zones" value={fmtInt(zones.length)} note={heatQ.data?.algorithm || '—'} icon={<FlaskConical size={16} />} />
                  <StatCard
                    label="Items clustered"
                    value={fmtInt(zones.reduce((a, z) => a + (z.item_count || 0), 0))}
                    note="Across all zones"
                    tone="brand"
                  />
                  <StatCard
                    label="Stock units"
                    value={fmtInt(zones.reduce((a, z) => a + (z.stock_qty || 0), 0))}
                    note="Total on hand per zone"
                    tone="coral"
                  />
                </div>

                <div className="card">
                  <div style={{ padding: '16px 16px 4px' }}>
                    <SectionHeading
                      title="Zone risk map"
                      description="K-Means clusters based on average expiry window and stock concentration."
                    />
                  </div>
                  <div className="table-wrap">
                    <table className="table" style={{ minWidth: 680 }}>
                      <thead>
                        <tr>
                          <th>Zone</th>
                          <th>Focus</th>
                          <th className="num">Items</th>
                          <th className="num">Stock</th>
                          <th className="num">Avg expiry (days)</th>
                          <th>Cluster</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zones.map((z) => (
                          <tr key={z.zone}>
                            <td style={{ fontWeight: 700 }}>{z.zone}</td>
                            <td>{z.name}</td>
                            <td className="num">{fmtInt(z.item_count)}</td>
                            <td className="num">{fmtInt(z.stock_qty)}</td>
                            <td className="num">{fmtNum(z.avg_expiry_days, 1)}</td>
                            <td>
                              <span className="row" style={{ gap: 8 }}>
                                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, flex: 'none' }} />
                                <StatusBadge
                                  tone={z.cluster_name.includes('Low') ? 'good' : z.cluster_name.includes('High') ? 'warning' : 'critical'}
                                >
                                  {z.cluster_name}
                                </StatusBadge>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="row" style={{ gap: 8, color: 'var(--warning)', fontSize: '0.8rem' }}>
                  <TriangleAlert size={14} aria-hidden="true" />
                  Cluster labels are assigned by the server's K-Means step; colour reflects the server-provided colour
                  for each cluster.
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {rulesQ.data?.total_transactions != null ? (
        <div className="text-faint" style={{ marginTop: 18, fontSize: '0.76rem' }}>
          Rules were last mined from {fmtInt(rulesQ.data.total_transactions)} transactions on page load. Re-run
          mining after new spoilage events arrive.
        </div>
      ) : null}
    </div>
  )
}
