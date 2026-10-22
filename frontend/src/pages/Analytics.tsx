import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Boxes, Layers, Scale, TriangleAlert } from 'lucide-react'
import { aiApi, compareApi, olapApi, productsApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import type { ComparePayload, ProductRow } from '../lib/types'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner, ErrorState } from '../components/ui/States'
import { StatCard } from '../components/ui/Metrics'
import { fmtInt, fmtMoney, fmtNum } from '../lib/format'

const STORE_COLORS = ['#226192', '#ef8557', '#237a57', '#b7791f', '#7894a8', '#c34242']

interface HeatmapPayload {
  zones?: { zone: string; name: string; avg_expiry_days: number; item_count: number; color: string }[]
}

interface OlapCube {
  data?: unknown[]
  groupBy?: string
}

export default function Analytics() {
  const compareQ = useApi<ComparePayload>(() => compareApi.getAll(), [], {
    validate: (d): d is ComparePayload => typeof d === 'object' && d !== null && Array.isArray((d as ComparePayload).stores),
  })
  const productsQ = useApi<ProductRow[]>(() => productsApi.getAll(), [], { validate: Array.isArray })
  const heatQ = useApi<HeatmapPayload>(() => aiApi.getHeatmap(), [], {
    validate: (d): d is HeatmapPayload => typeof d === 'object' && d !== null && 'zones' in d,
  })
  const olapQ = useApi<OlapCube>(() => olapApi.getCube('category'), [], {
    validate: (d): d is OlapCube => typeof d === 'object' && d !== null && Array.isArray((d as OlapCube).data),
  })

  const compare = compareQ.data

  const mixChart = useMemo(() => {
    const mix = compare?.category_mix
    if (!mix) return []
    const storeKeys = Object.keys(mix)
    const catTotals = new Map<string, number>()
    for (const k of storeKeys) {
      for (const [cat, units] of Object.entries(mix[k].categories || {})) {
        catTotals.set(cat, (catTotals.get(cat) || 0) + Number(units))
      }
    }
    const topCats = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map((e) => e[0])
    return topCats.map((cat) => {
      const row: Record<string, string | number> = { category: cat }
      storeKeys.forEach((k) => {
        row[mix[k].name || `Store ${k}`] = Number(mix[k].categories?.[cat] || 0)
      })
      return row
    })
  }, [compare])

  const storeNames = useMemo(() => {
    const mix = compare?.category_mix
    if (!mix) return []
    return Object.keys(mix).map((k, i) => ({ key: mix[k].name || `Store ${k}`, color: STORE_COLORS[i % STORE_COLORS.length] }))
  }, [compare])

  const catalogMix = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of productsQ.data || []) {
      const c = p.category || '(uncategorized)'
      m.set(c, (m.get(c) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([category, count]) => ({ category, count }))
  }, [productsQ.data])

  const stores = compare?.stores || []
  const totals = {
    units: stores.reduce((a, s) => a + (s.total_units || 0), 0),
    expired: stores.reduce((a, s) => a + (s.total_expired_rows || 0), 0),
    orderCost: stores.reduce((a, s) => a + (s.total_est_cost || 0), 0),
    items: stores.reduce((a, s) => a + (s.item_count || 0), 0),
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Cross-store movement, category mix and catalog composition — built only from endpoints that respond with real data."
      />

      {compareQ.loading ? <CardSkeleton count={2} /> : null}
      {compareQ.error ? (
        <ErrorState title="Comparison metrics could not be loaded" description={compareQ.error} onRetry={compareQ.reload} />
      ) : null}

      {compare ? (
        <>
          <div className="grid grid-4">
            <StatCard label="Stores compared" value={fmtInt(compare.store_count)} note={`computed ${compare.computed_at ? new Date(compare.computed_at).toLocaleDateString('en-IN') : '—'}`} icon={<Scale size={16} />} />
            <StatCard label="Units sold (total)" value={fmtInt(totals.units)} note="Sum across stores with sales data" tone="brand" icon={<Layers size={16} />} />
            <StatCard label="Expired rows" value={fmtInt(totals.expired)} note="Expiry before anchor date" tone="bad" icon={<TriangleAlert size={16} />} />
            <StatCard label="Reorder estimate" value={fmtMoney(totals.orderCost)} note="Next-batch cost where priced" tone="coral" icon={<Boxes size={16} />} />
          </div>

          <div className="card card-pad" style={{ marginTop: 18 }}>
            <SectionHeading
              title="Category mix by store"
              description="Units sold per category, side by side. Stores without a sales column simply contribute zero."
            />
            {mixChart.length === 0 ? (
              <p className="text-faint" style={{ marginTop: 14 }}>
                No category mix available — no store has uploaded a dataset with both category and sales columns.
              </p>
            ) : (
              <div style={{ height: 320, marginTop: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mixChart} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {storeNames.map((s) => (
                      <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card card-pad">
              <SectionHeading title="Catalog composition" description="Products per category in the OLTP catalog." />
              {productsQ.loading ? (
                <div className="skeleton" style={{ height: 220, marginTop: 14 }} />
              ) : productsQ.error ? (
                <DegradedBanner title="Catalog unavailable" onRetry={productsQ.reload}>
                  {productsQ.error}
                </DegradedBanner>
              ) : (
                <div style={{ height: 260, marginTop: 14 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={catalogMix} layout="vertical" margin={{ top: 4, right: 12, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                      <Bar dataKey="count" fill="#226192" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card card-pad">
              <SectionHeading title="Average expiry window by zone" description="From the K-Means zone heatmap endpoint." />
              {heatQ.loading ? (
                <div className="skeleton" style={{ height: 220, marginTop: 14 }} />
              ) : heatQ.error ? (
                <DegradedBanner title="Heatmap unavailable" onRetry={heatQ.reload}>
                  {heatQ.error}
                </DegradedBanner>
              ) : (
                <div style={{ height: 260, marginTop: 14 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(heatQ.data?.zones || []).map((z) => ({ zone: z.zone, days: z.avg_expiry_days }))} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                      <Bar dataKey="days" fill="#ef8557" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ padding: '16px 16px 4px' }}>
              <SectionHeading title="Per-store analytics summary" description="The same numbers that feed each store's detail tabs." />
            </div>
            <div className="table-wrap">
              <table className="table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Store</th>
                    <th className="num">Items</th>
                    <th className="num">Records</th>
                    <th className="num">Units sold</th>
                    <th className="num">Expired rows</th>
                    <th className="num">Items to order</th>
                    <th className="num">Order cost</th>
                    <th>Cost basis</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.store_id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td className="num">{fmtInt(s.item_count)}</td>
                      <td className="num">{fmtInt(s.record_count)}</td>
                      <td className="num">{s.sales_available ? fmtInt(s.total_units) : '—'}</td>
                      <td className="num">{s.expiry_available ? fmtInt(s.total_expired_rows) : '—'}</td>
                      <td className="num">{s.items_to_order == null ? '—' : fmtInt(s.items_to_order)}</td>
                      <td className="num">{s.total_est_cost == null ? '—' : fmtMoney(s.total_est_cost)}</td>
                      <td>{s.est_cost_basis || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <SectionHeading
          title="OLAP cube"
          description="The /api/olap/cube endpoint is part of the backend but currently degraded."
        />
        {olapQ.loading ? (
          <div className="skeleton" style={{ height: 100, marginTop: 12 }} />
        ) : olapQ.error ? (
          <div style={{ marginTop: 12 }}>
            <DegradedBanner title="OLAP cube unavailable" onRetry={olapQ.reload}>
              {olapQ.error} Group-by-category aggregation cannot be displayed until the server returns a{' '}
              <code>data[]</code> payload.
            </DegradedBanner>
          </div>
        ) : null}
      </div>

      <div className="text-faint" style={{ marginTop: 16, fontSize: '0.76rem' }}>
        <Layers size={11} aria-hidden="true" style={{ verticalAlign: '-1px' }} /> Cross-store figures come from{' '}
        <code>/api/compare</code> (precomputed metrics). Catalog composition is aggregated in the browser from{' '}
        <code>/api/products</code> ({fmtNum(productsQ.data?.length ?? 0, 0)} rows).
      </div>
    </div>
  )
}
