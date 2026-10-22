import { Link } from 'react-router-dom'
import { Download, Layers, Scale, Store as StoreIcon, TriangleAlert } from 'lucide-react'
import { compareApi } from '../../lib/api'
import { useApi } from '../../lib/hooks'
import type { ComparePayload, CompareStoreRow } from '../../lib/types'
import { PageHeader, SectionHeading } from '../../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner, EmptyState, ErrorState } from '../../components/ui/States'
import { StatCard, StatusBadge, CapabilityRow } from '../../components/ui/Metrics'
import DataTable from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import { downloadCsv, fmtDate, fmtInt, fmtMoney, fmtRelative } from '../../lib/format'

function isComparePayload(d: unknown): d is ComparePayload {
  return (
    typeof d === 'object' &&
    d !== null &&
    Array.isArray((d as ComparePayload).stores) &&
    Array.isArray((d as ComparePayload).common_items)
  )
}

export default function Compare() {
  const { data, error, loading, reload } = useApi<ComparePayload>(() => compareApi.getAll(), [], {
    validate: isComparePayload,
  })

  const withUpload = data?.stores.filter((s) => s.expiry_available || s.sales_available) ?? []

  return (
    <div>
      <PageHeader
        title="Compare stores"
        subtitle="Side-by-side metrics from every store with an active dataset. Unavailable columns are labelled, never filled with placeholder numbers."
        actions={
          <Link to="/stores" className="btn btn-secondary">
            <StoreIcon size={16} aria-hidden="true" /> Manage stores
          </Link>
        }
      />

      {loading ? <CardSkeleton count={2} /> : null}

      {!loading && error ? (
        <ErrorState title="Comparison data could not be loaded" description={error} onRetry={reload} />
      ) : null}

      {!loading && !error && data && data.store_count === 0 ? (
        <EmptyState
          icon={<Scale size={20} />}
          title="No stores to compare"
          description="Add at least two stores and attach datasets to them — then their metrics will line up here."
          action={
            <Link to="/stores/new" className="btn btn-primary">
              Add a store
            </Link>
          }
        />
      ) : null}

      {!loading && !error && data && data.store_count > 0 && withUpload.length === 0 ? (
        <DegradedBanner title="Stores exist, but none has an analytics-ready dataset">
          Comparison needs at least one store with an active upload containing stock or sales columns. Upload a
          dataset from any store page to light this screen up.
        </DegradedBanner>
      ) : null}

      {!loading && !error && data ? (
        <div className="stack" style={{ gap: 18 }}>
          <div className="grid grid-4">
            <StatCard label="Stores" value={fmtInt(data.store_count)} note={`${withUpload.length} with analytics`} icon={<StoreIcon size={16} />} />
            <StatCard
              label="Common items"
              value={fmtInt(data.common_items.length)}
              note="Products sold in more than one store"
              tone="brand"
              icon={<Layers size={16} />}
            />
            <StatCard
              label="Consolidated orders"
              value={fmtInt(data.consolidated_orders.length)}
              note="Combined across stores"
              tone="coral"
              icon={<Download size={16} />}
            />
            <StatCard
              label="Computed"
              value={fmtRelative(data.computed_at)}
              note={fmtDate(data.computed_at)}
              tone={data.computed_at ? 'ok' : 'warn'}
              icon={<Scale size={16} />}
            />
          </div>

          <div className="card">
            <div style={{ padding: '16px 16px 4px' }}>
              <SectionHeading
                title="Store metrics"
                description="Totals come from each store's precomputed metrics payload."
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() =>
                      downloadCsv(
                        'store-comparison.csv',
                        data.stores.map((s) => ({
                          store: s.name,
                          city: s.city ?? '',
                          item_count: s.item_count,
                          record_count: s.record_count,
                          total_units: s.total_units ?? '',
                          total_expired_rows: s.total_expired_rows ?? '',
                          items_to_order: s.items_to_order ?? '',
                          total_order_units: s.total_order_units ?? '',
                          total_est_cost: s.total_est_cost ?? '',
                          est_cost_basis: s.est_cost_basis ?? '',
                          expiry_available: s.expiry_available,
                          sales_available: s.sales_available,
                        })),
                      )
                    }
                  >
                    Export CSV
                  </Button>
                }
              />
            </div>
            <DataTable
              minWidth={980}
              columns={[
                {
                  key: 'name',
                  header: 'Store',
                  render: (r: CompareStoreRow) => (
                    <div>
                      <Link to={`/stores/${r.store_id}`} style={{ fontWeight: 700 }}>
                        {r.name}
                      </Link>
                      <div className="text-faint" style={{ fontSize: '0.74rem' }}>
                        {r.city || 'Location not set'}
                      </div>
                    </div>
                  ),
                },
                { key: 'item_count', header: 'Items', align: 'right', render: (r) => fmtInt(r.item_count) },
                { key: 'record_count', header: 'Records', align: 'right', render: (r) => fmtInt(r.record_count) },
                {
                  key: 'total_units',
                  header: 'Units sold',
                  align: 'right',
                  render: (r) =>
                    r.sales_available && r.total_units != null ? fmtInt(r.total_units) : <span className="text-faint">—</span>,
                },
                {
                  key: 'total_expired_rows',
                  header: 'Expired rows',
                  align: 'right',
                  render: (r) =>
                    r.expiry_available && r.total_expired_rows != null ? (
                      <span style={{ color: r.total_expired_rows > 0 ? 'var(--critical)' : undefined }}>
                        {fmtInt(r.total_expired_rows)}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    ),
                },
                { key: 'items_to_order', header: 'To order', align: 'right', render: (r) => (r.items_to_order == null ? <span className="text-faint">—</span> : fmtInt(r.items_to_order)) },
                { key: 'total_order_units', header: 'Order units', align: 'right', render: (r) => (r.total_order_units == null ? <span className="text-faint">—</span> : fmtInt(r.total_order_units)) },
                {
                  key: 'total_est_cost',
                  header: 'Est. order cost',
                  align: 'right',
                  render: (r) =>
                    r.total_est_cost == null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <span title={`Basis: ${r.est_cost_basis || 'unknown'}`}>{fmtMoney(r.total_est_cost)}</span>
                    ),
                },
                {
                  key: 'flags',
                  header: 'Analytics',
                  render: (r) => (
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <StatusBadge tone={r.expiry_available ? 'success' : 'neutral'}>
                        {r.expiry_available ? 'Expiry' : 'No expiry'}
                      </StatusBadge>
                      <StatusBadge tone={r.sales_available ? 'success' : 'neutral'}>
                        {r.sales_available ? 'Sales' : 'No sales'}
                      </StatusBadge>
                    </div>
                  ),
                },
              ]}
              rows={data.stores}
              rowKey={(r) => r.store_id}
              caption="Store comparison"
            />
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div style={{ padding: '16px 16px 4px' }}>
                <SectionHeading
                  title="Common items"
                  description="Products that appear in more than one store dataset."
                />
              </div>
              {data.common_items.length === 0 ? (
                <div style={{ padding: '0 16px 16px' }}>
                  <p className="text-faint" style={{ fontSize: '0.86rem' }}>
                    No product names overlap between stores yet.
                  </p>
                </div>
              ) : (
                <DataTable
                  minWidth={480}
                  columns={[
                    { key: 'item', header: 'Item', render: (r: ComparePayload['common_items'][number]) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
                    { key: 'store_count', header: 'Stores', align: 'right', render: (r) => fmtInt(r.store_count) },
                    {
                      key: 'best_store',
                      header: 'Best stock',
                      render: (r) => r.best_store || <span className="text-faint">—</span>,
                    },
                    {
                      key: 'units',
                      header: 'Units by store',
                      render: (r) => (
                        <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                          {r.stores.map((s) => `${s.name}: ${s.total_units == null ? '—' : fmtInt(s.total_units)}`).join(' · ')}
                        </span>
                      ),
                    },
                  ]}
                  rows={data.common_items.slice(0, 50)}
                  rowKey={(r) => r.item}
                  caption="Common items across stores"
                />
              )}
            </div>

            <div className="card">
              <div style={{ padding: '16px 16px 4px' }}>
                <SectionHeading
                  title="Consolidated reorder list"
                  description="Combined recommended quantities, attributed per store."
                  actions={
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={() =>
                        downloadCsv(
                          'consolidated-orders.csv',
                          data.consolidated_orders.map((c) => ({
                            item: c.item,
                            category: c.category ?? '',
                            total_recommended_qty: c.total_recommended_qty,
                            stores: c.stores.map((s) => `${s.name}:${s.recommended_qty}`).join(' | '),
                          })),
                        )
                      }
                    >
                      Export CSV
                    </Button>
                  }
                />
              </div>
              {data.consolidated_orders.length === 0 ? (
                <div style={{ padding: '0 16px 16px' }}>
                  <p className="text-faint" style={{ fontSize: '0.86rem' }}>
                    No store currently recommends an order (stock + sales columns required).
                  </p>
                </div>
              ) : (
                <DataTable
                  minWidth={480}
                  columns={[
                    { key: 'item', header: 'Item', render: (r: ComparePayload['consolidated_orders'][number]) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
                    { key: 'category', header: 'Category', render: (r) => r.category || <span className="text-faint">—</span> },
                    {
                      key: 'total_recommended_qty',
                      header: 'Total qty',
                      align: 'right',
                      render: (r) => <strong>{fmtInt(r.total_recommended_qty)}</strong>,
                    },
                    {
                      key: 'stores',
                      header: 'Per store',
                      render: (r) => (
                        <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                          {r.stores.map((s) => `${s.name}: ${s.recommended_qty}`).join(' · ')}
                        </span>
                      ),
                    },
                  ]}
                  rows={data.consolidated_orders.slice(0, 50)}
                  rowKey={(r) => r.item}
                  caption="Consolidated orders"
                />
              )}
            </div>
          </div>

          {data.common_items.some((c) => c.stores.some((s) => s.total_units == null)) ? (
            <div className="row" style={{ gap: 8, color: 'var(--warning)', fontSize: '0.8rem' }}>
              <TriangleAlert size={14} aria-hidden="true" /> Some stores do not track units sold, so their comparison
              cells stay blank.
            </div>
          ) : null}

          <div className="card card-pad">
            <SectionHeading title="Capabilities per store" description="What each dataset can support." />
            <div className="stack" style={{ gap: 14, marginTop: 14 }}>
              {data.stores.map((s) => (
                <div key={s.store_id}>
                  <Link to={`/stores/${s.store_id}`} style={{ fontWeight: 700 }}>
                    {s.name}
                  </Link>
                  <div style={{ marginTop: 6 }}>
                    <CapabilityRow capabilities={s.capabilities} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
