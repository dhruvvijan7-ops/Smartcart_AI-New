import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Boxes, ExternalLink, Search, TriangleAlert } from 'lucide-react'
import { productsApi } from '../lib/api'
import { useApi, useDebounced } from '../lib/hooks'
import type { ProductRow } from '../lib/types'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, TableSkeleton } from '../components/ui/States'
import { StatCard, StatusBadge, toneFromRisk } from '../components/ui/Metrics'
import DataTable, { Pagination } from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import { downloadCsv, fmtDate, fmtInt, fmtMoney, fmtNum } from '../lib/format'

const PAGE_SIZE = 25

export default function Inventory() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const zone = params.get('zone') || ''

  const [search, setSearch] = useState(q)
  const debounced = useDebounced(search, 350)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ProductRow | null>(null)

  useEffect(() => {
    setSearch(q)
  }, [q])

  useEffect(() => {
    const next = new URLSearchParams(params)
    if (debounced) next.set('q', debounced)
    else next.delete('q')
    if (category) next.set('category', category)
    else next.delete('category')
    if (zone) next.set('zone', zone)
    else next.delete('zone')
    setParams(next, { replace: true })
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, category, zone])

  const queryArgs = useMemo(() => {
    const p: Record<string, string> = {}
    if (debounced.trim()) p.search = debounced.trim()
    if (category) p.category = category
    if (zone) p.zone = zone
    return p
  }, [debounced, category, zone])

  const productsQ = useApi<ProductRow[]>(() => productsApi.getAll(queryArgs), [JSON.stringify(queryArgs)], {
    validate: Array.isArray,
  })
  const catsQ = useApi<string[]>(() => productsApi.getCategories(), [], { validate: Array.isArray })

  const [zoneOptions, setZoneOptions] = useState<string[]>([])

  useEffect(() => {
    const rows = productsQ.data
    if (!rows) return
    setZoneOptions((prev) => {
      const next = new Set(prev)
      if (zone) next.add(zone)
      for (const p of rows) if (p.zone) next.add(p.zone)
      const arr = [...next].sort()
      if (arr.length === prev.length && arr.every((v, i) => v === prev[i])) return prev
      return arr
    })
  }, [productsQ.data, zone])

  const all = productsQ.data || []
  const pageRows = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const critical = all.filter((p) => toneFromRisk(p.risk_tier || p.riskClass) === 'critical').length

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Catalog products from the OLTP database with risk scoring, stock levels and expiry dates."
        actions={
          <button
            className="btn btn-secondary"
            onClick={() =>
              downloadCsv(
                'inventory.csv',
                all.map((p) => ({
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  sku: p.sku ?? '',
                  zone: p.zone ?? '',
                  stock: p.quantity_on_hand ?? p.stock ?? '',
                  unit_price: p.unit_price ?? '',
                  unit_cost: p.unit_cost ?? '',
                  expiry_date: p.expiry_date ?? '',
                  risk_tier: p.risk_tier ?? p.riskClass ?? '',
                  risk_score: p.riskScore ?? p.risk_score ?? '',
                  supplier: p.supplier_name ?? '',
                })),
              )
            }
          >
            Export CSV
          </button>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard label="Products" value={fmtInt(all.length)} note={debounced || category || zone ? 'Matching current filters' : 'Entire catalog'} icon={<Boxes size={16} />} />
        <StatCard label="Critical tier" value={fmtInt(critical)} tone="bad" note="Highest risk scores first" icon={<TriangleAlert size={16} />} />
        <StatCard
          label="Units on hand"
          value={fmtInt(all.reduce((a, p) => a + (Number(p.quantity_on_hand) || Number(p.stock) || 0), 0))}
          note="Store 1 stock joins"
          tone="brand"
        />
        <StatCard
          label="Categories"
          value={fmtInt(catsQ.data?.length ?? 0)}
          note="Distinct catalog categories"
          tone="ok"
        />
      </div>

      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="topbar-search" style={{ width: 'min(300px, 100%)' }}>
            <span className="input-icon" aria-hidden="true">
              <Search size={15} />
            </span>
            <label className="sr-only" htmlFor="inv-search">
              Search products
            </label>
            <input
              id="inv-search"
              type="search"
              className="input"
              placeholder="Search name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="row" style={{ gap: 6, fontSize: '0.84rem' }}>
            <span className="sr-only">Category</span>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value, setParams, params)} style={{ width: 170 }}>
              <option value="">All categories</option>
              {(catsQ.data || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="row" style={{ gap: 6, fontSize: '0.84rem' }}>
            <span className="sr-only">Zone</span>
            <select className="select" value={zone} onChange={(e) => setZone(e.target.value, setParams, params)} style={{ width: 140 }}>
              <option value="">All zones</option>
              {zoneOptions.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
        </div>
        {productsQ.data ? (
          <span className="text-faint" style={{ fontSize: '0.8rem' }}>
            {fmtInt(all.length)} products
          </span>
        ) : null}
      </div>

      {productsQ.loading ? <TableSkeleton rows={8} cols={6} /> : null}
      {!productsQ.loading && productsQ.error ? (
        <ErrorState title="Products could not be loaded" description={productsQ.error} onRetry={productsQ.reload} />
      ) : null}

      {!productsQ.loading && !productsQ.error && all.length === 0 ? (
        <EmptyState
          icon={<Search size={20} />}
          title="No products match"
          description="Adjust the search or clear the filters to see the full catalog."
        />
      ) : null}

      {!productsQ.loading && !productsQ.error && all.length > 0 ? (
        <div className="card">
          <DataTable
            minWidth={880}
            columns={[
              {
                key: 'name',
                header: 'Product',
                render: (p) => (
                  <button className="btn-link" style={{ fontWeight: 700, textAlign: 'left' }} onClick={() => setSelected(p)}>
                    {p.name}
                  </button>
                ),
              },
              { key: 'category', header: 'Category', render: (p) => p.category || '—' },
              { key: 'sku', header: 'SKU', render: (p) => <span className="text-secondary">{p.sku || '—'}</span> },
              { key: 'zone', header: 'Zone', render: (p) => p.zone || '—' },
              {
                key: 'stock',
                header: 'On hand',
                align: 'right',
                render: (p) => fmtInt(p.quantity_on_hand ?? p.stock ?? 0),
              },
              {
                key: 'price',
                header: 'Price',
                align: 'right',
                render: (p) => (p.unit_price == null ? '—' : fmtMoney(p.unit_price, true)),
              },
              {
                key: 'expiry',
                header: 'Expiry',
                render: (p) => (p.expiry_date ? fmtDate(p.expiry_date) : '—'),
              },
              {
                key: 'risk',
                header: 'Risk',
                render: (p) => (
                  <span className="row" style={{ gap: 8 }}>
                    <StatusBadge tone={toneFromRisk(p.risk_tier || p.riskClass)}>{p.risk_tier || p.riskClass || '—'}</StatusBadge>
                    <span className="text-faint" style={{ fontSize: '0.78rem' }}>
                      {fmtNum(p.riskScore ?? p.risk_score, 0)}
                    </span>
                  </span>
                ),
              },
              {
                key: 'supplier',
                header: 'Supplier',
                render: (p) => <span className="text-secondary">{p.supplier_name || '—'}</span>,
              },
            ]}
            rows={pageRows}
            rowKey={(p) => p.id}
            caption="Catalog products"
          />
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination page={page} pageSize={PAGE_SIZE} total={all.length} onPageChange={setPage} label="products" />
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected ? `${selected.category}${selected.sub_category ? ` · ${selected.sub_category}` : ''}` : ''}
      >
        {selected ? (
          <div className="stack" style={{ gap: 14 }}>
            {selected.image ? (
              <img
                src={selected.image}
                alt=""
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              />
            ) : null}
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge tone={toneFromRisk(selected.risk_tier || selected.riskClass)}>
                {selected.risk_tier || selected.riskClass || 'Unknown tier'}
              </StatusBadge>
              <span className="chip">score {fmtNum(selected.riskScore ?? selected.risk_score, 0)}</span>
              {selected.zone ? <span className="chip">{selected.zone}</span> : null}
            </div>
            <dl className="kv-list">
              <div>
                <dt>SKU</dt>
                <dd>{selected.sku || '—'}</dd>
              </div>
              <div>
                <dt>Unit</dt>
                <dd>{selected.unit || '—'}</dd>
              </div>
              <div>
                <dt>On hand</dt>
                <dd>{fmtInt(selected.quantity_on_hand ?? selected.stock ?? 0)}</dd>
              </div>
              <div>
                <dt>Reorder threshold</dt>
                <dd>{selected.reorder_threshold == null ? '—' : fmtInt(selected.reorder_threshold)}</dd>
              </div>
              <div>
                <dt>Unit cost</dt>
                <dd>{selected.unit_cost == null ? '—' : fmtMoney(selected.unit_cost, true)}</dd>
              </div>
              <div>
                <dt>Unit price</dt>
                <dd>{selected.unit_price == null ? '—' : fmtMoney(selected.unit_price, true)}</dd>
              </div>
              <div>
                <dt>Expiry date</dt>
                <dd>{fmtDate(selected.expiry_date)}</dd>
              </div>
              <div>
                <dt>Shelf life</dt>
                <dd>{selected.expiry_days == null ? '—' : `${selected.expiry_days} days`}</dd>
              </div>
              <div>
                <dt>Supplier</dt>
                <dd>{selected.supplier_name || '—'}</dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>{selected.batch_id || '—'}</dd>
              </div>
            </dl>
            {selected.recommendedAction ? (
              <div className="tint-panel" style={{ fontSize: '0.86rem' }}>
                <strong>Recommended action:</strong> {selected.recommendedAction}
              </div>
            ) : null}
            <div className="text-faint" style={{ fontSize: '0.76rem' }}>
              <ExternalLink size={11} aria-hidden="true" style={{ verticalAlign: '-1px' }} /> Risk score and action are
              computed by the API's enrichment layer for catalog products.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function setCategory(v: string, setParams: ReturnType<typeof useSearchParams>[1], params: URLSearchParams) {
  const next = new URLSearchParams(params)
  if (v) next.set('category', v)
  else next.delete('category')
  setParams(next, { replace: true })
}

function setZone(v: string, setParams: ReturnType<typeof useSearchParams>[1], params: URLSearchParams) {
  const next = new URLSearchParams(params)
  if (v) next.set('zone', v)
  else next.delete('zone')
  setParams(next, { replace: true })
}
