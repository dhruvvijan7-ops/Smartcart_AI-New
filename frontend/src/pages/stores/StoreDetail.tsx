import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeft,
  Database,
  Download,
  Layers,
  PackagePlus,
  Pencil,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Store as StoreIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Upload as UploadIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiErrorMessage, storesApi } from '../../lib/api'
import { useApi, useDebounced, useQueryParam } from '../../lib/hooks'
import type { StoreItem, StoreItemsResponse, StoreMetrics, StoreRecord } from '../../lib/types'
import { PageHeader, SectionHeading } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, TableSkeleton, DegradedBanner } from '../../components/ui/States'
import { StatCard, StatusBadge, CapabilitySummary, toneFromRisk } from '../../components/ui/Metrics'
import DataTable, { Pagination } from '../../components/ui/Table'
import type { Column, SortState } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { TextInput } from '../../components/ui/Forms'
import {
  downloadCsv,
  fmtDate,
  fmtDateTime,
  fmtInt,
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtRelative,
} from '../../lib/format'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'items', label: 'Items' },
  { id: 'expiry', label: 'Expiry' },
  { id: 'sales', label: 'Sales' },
  { id: 'orders', label: 'Reorder' },
  { id: 'data', label: 'Dataset' },
]

const BAND_COLORS: Record<string, string> = {
  Critical: '#c34242',
  High: '#ef8557',
  Watch: '#b7791f',
  Stable: '#237a57',
}

function IssuesBadge({ issues }: { issues?: string[] }) {
  if (!issues || !issues.length) return <span className="text-faint">—</span>
  return (
    <StatusBadge tone="warning" title={issues.join('; ')}>
      {issues.length} issue{issues.length > 1 ? 's' : ''}
    </StatusBadge>
  )
}

/* ───────────────────────── Manual item form ───────────────────────── */

const EMPTY_ITEM = {
  product_name: '',
  category: '',
  stock: '',
  reorder_level: '',
  reorder_quantity: '',
  unit_price: '',
  unit_cost: '',
  units_sold: '',
  expiry_date: '',
  received_date: '',
}

function ManualItemModal({
  open,
  onClose,
  storeId,
  item,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  storeId: number
  item: StoreItem | null
  onSaved: () => void
}) {
  const [form, setForm] = useState(EMPTY_ITEM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameErr, setNameErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setNameErr(null)
    if (item) {
      setForm({
        product_name: item.product_name ?? '',
        category: item.category ?? '',
        stock: item.stock == null ? '' : String(item.stock),
        reorder_level: item.reorder_level == null ? '' : String(item.reorder_level),
        reorder_quantity: item.reorder_quantity == null ? '' : String(item.reorder_quantity),
        unit_price: item.unit_price == null ? '' : String(item.unit_price),
        unit_cost: item.unit_cost == null ? '' : String(item.unit_cost),
        units_sold: item.units_sold == null ? '' : String(item.units_sold),
        expiry_date: item.expiry_date ?? '',
        received_date: item.received_date ?? '',
      })
    } else {
      setForm(EMPTY_ITEM)
    }
  }, [open, item])

  const set = (k: keyof typeof EMPTY_ITEM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name.trim()) {
      setNameErr('Product name is required.')
      return
    }
    setNameErr(null)
    setBusy(true)
    setError(null)
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' && k !== 'product_name' && k !== 'category' ? null : v]),
    )
    try {
      if (item) {
        await storesApi.updateItem(storeId, item.id, payload)
        toast.success('Manual item updated')
      } else {
        await storesApi.createItem(storeId, payload)
        toast.success('Manual item added')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'The item could not be saved.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={item ? 'Edit manual item' : 'Add manual item'}
      subtitle={
        item
          ? 'Dataset rows are read-only; only manual items can be edited.'
          : 'Manual items live alongside dataset rows and feed the same analytics.'
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        <div className="grid grid-2">
          <TextInput
            label="Product name"
            required
            value={form.product_name}
            onChange={set('product_name')}
            error={nameErr}
            maxLength={255}
          />
          <TextInput label="Category" value={form.category} onChange={set('category')} maxLength={120} />
          <TextInput label="Stock" type="number" step="any" value={form.stock} onChange={set('stock')} hint="Defaults to 0." />
          <TextInput label="Reorder level" type="number" step="any" value={form.reorder_level} onChange={set('reorder_level')} />
          <TextInput label="Reorder quantity" type="number" step="any" value={form.reorder_quantity} onChange={set('reorder_quantity')} />
          <TextInput label="Units sold" type="number" step="any" value={form.units_sold} onChange={set('units_sold')} />
          <TextInput label="Unit price" type="number" step="any" value={form.unit_price} onChange={set('unit_price')} />
          <TextInput label="Unit cost" type="number" step="any" value={form.unit_cost} onChange={set('unit_cost')} />
          <TextInput label="Expiry date" type="date" value={form.expiry_date} onChange={set('expiry_date')} />
          <TextInput label="Received date" type="date" value={form.received_date} onChange={set('received_date')} />
        </div>
        {error ? (
          <div className="degraded-banner" role="alert">
            <TriangleAlert size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
            <div>{error}</div>
          </div>
        ) : null}
        <div className="row" style={{ gap: 10 }}>
          <Button type="submit" loading={busy}>
            {item ? 'Save changes' : 'Add item'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/* ───────────────────────── Tabs ───────────────────────── */

function OverviewTab({ store, metrics }: { store: StoreRecord; metrics: StoreMetrics | null }) {
  const m = metrics
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <StatCard
          label="Distinct items"
          value={m ? fmtInt(m.item_count) : '—'}
          note={m ? 'Unique product names' : 'Metrics not loaded'}
          icon={<Layers size={16} />}
        />
        <StatCard
          label="Records"
          value={m ? fmtInt(m.record_count) : '—'}
          note={m ? `${fmtInt(m.manual_item_count)} manual` : '—'}
          tone="brand"
          icon={<Database size={16} />}
        />
        <StatCard
          label="Active upload"
          value={store.active_upload_id ? `#${store.active_upload_id}` : 'None'}
          note={m?.upload ? m.upload.filename : store.active_upload_id ? '' : 'Attach a dataset'}
          tone={store.active_upload_id ? 'ok' : 'warn'}
          icon={<UploadIcon size={16} />}
        />
        <StatCard
          label="Items to order"
          value={m?.orders?.available ? fmtInt(m.orders.totals.items_to_order) : '—'}
          note={m?.orders?.available ? `${fmtInt(m.orders.totals.total_units)} units` : 'Needs stock + sales'}
          tone={m?.orders?.available ? 'coral' : 'warn'}
          icon={<ShoppingCart size={16} />}
        />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <SectionHeading title="Dataset capabilities" description="What the active dataset can support." />
          <div style={{ marginTop: 12 }}>
            {m ? <CapabilitySummary capabilities={m.capabilities} /> : <p className="text-faint">Metrics unavailable.</p>}
          </div>
          {m ? (
            <div className="text-faint" style={{ fontSize: '0.78rem', marginTop: 12 }}>
              Anchor date {fmtDate(m.anchor_date)} · window {m.window_days ?? '—'} days · computed{' '}
              {fmtRelative(m.computed_at)}
            </div>
          ) : null}
        </div>

        <div className="card card-pad">
          <SectionHeading title="Store profile" description="Planning parameters used by reorder calculations." />
          <dl className="kv-list" style={{ marginTop: 12 }}>
            <div>
              <dt>City</dt>
              <dd>{store.city || '—'}</dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{store.lead_time_days} days</dd>
            </div>
            <div>
              <dt>Safety stock</dt>
              <dd>{store.safety_days} days</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{fmtDateTime(store.created_at)}</dd>
            </div>
            <div>
              <dt>Active upload</dt>
              <dd>{store.active_upload_id ? `#${store.active_upload_id}` : 'None'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {m?.orders?.available ? (
        <div className="card card-pad">
          <SectionHeading
            title="Reorder at a glance"
            description="Derived from stock, sales movement and your store's lead time."
            actions={
              <Link to="?tab=orders" className="btn btn-secondary btn-sm">
                Open reorder list
              </Link>
            }
          />
          <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {Object.entries(m.orders.by_category).map(([cat, units]) => (
              <span className="chip" key={cat}>
                {cat} · {fmtInt(units)} u
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ItemsTab({
  storeId,
  activeUploadId,
  onItemsChanged,
}: {
  storeId: number
  activeUploadId: number | null
  onItemsChanged: () => void
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort, setSort] = useState<SortState>({ key: 'product_name', dir: 'asc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItem | null>(null)
  const [deleting, setDeleting] = useState<StoreItem | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sort.key, sort.dir])

  const cleanParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
      sort: sort.key,
      dir: sort.dir,
    }
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim()
    return p
  }, [page, pageSize, debouncedSearch, sort])

  const { data, error, loading, reload } = useApi<StoreItemsResponse>(
    () => storesApi.items(storeId, cleanParams),
    [storeId, cleanParams.page, cleanParams.page_size, cleanParams.search, cleanParams.sort, cleanParams.dir],
    {
      validate: (d): d is StoreItemsResponse =>
        typeof d === 'object' && d !== null && Array.isArray((d as StoreItemsResponse).items),
    },
  )

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await storesApi.removeItem(storeId, deleting.id)
      toast.success('Manual item removed')
      setDeleting(null)
      reload()
      onItemsChanged()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove the item.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns: Column<StoreItem>[] = [
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate" style={{ fontWeight: 600 }}>
            {r.product_name || <span className="text-faint">(unnamed)</span>}
          </div>
          <div className="text-faint" style={{ fontSize: '0.74rem' }}>
            {r.source === 'manual' ? 'manual entry' : `row ${r.row_number ?? '—'}`}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category || <span className="text-faint">—</span> },
    { key: 'stock', header: 'Stock', align: 'right', sortable: true, render: (r) => (r.stock == null ? '—' : fmtInt(r.stock)) },
    {
      key: 'reorder_level',
      header: 'Reorder level',
      align: 'right',
      sortable: true,
      render: (r) => (r.reorder_level == null ? '—' : fmtInt(r.reorder_level)),
    },
    {
      key: 'units_sold',
      header: 'Units sold',
      align: 'right',
      sortable: true,
      render: (r) => (r.units_sold == null ? '—' : fmtInt(r.units_sold)),
    },
    {
      key: 'unit_price',
      header: 'Price',
      align: 'right',
      sortable: true,
      render: (r) => (r.unit_price == null ? '—' : fmtMoney(r.unit_price, true)),
    },
    {
      key: 'expiry_date',
      header: 'Expiry',
      sortable: true,
      render: (r) => (r.expiry_date ? fmtDate(r.expiry_date) : <span className="text-faint">—</span>),
    },
    { key: 'issues', header: 'Quality', render: (r) => <IssuesBadge issues={r.issues} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      render: (r) =>
        r.source === 'manual' ? (
          <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
            <button
              className="icon-btn"
              aria-label={`Edit ${r.product_name}`}
              title="Edit manual item"
              onClick={() => {
                setEditing(r)
                setModalOpen(true)
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              className="icon-btn"
              aria-label={`Delete ${r.product_name}`}
              title="Delete manual item"
              onClick={() => setDeleting(r)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <span className="text-faint" title="Dataset rows are read-only. Re-upload to change them." style={{ fontSize: '0.74rem' }}>
            read-only
          </span>
        ),
    },
  ]

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <div className="topbar-search" style={{ width: 'min(300px, 100%)' }}>
            <label className="sr-only" htmlFor="item-search">
              Search items
            </label>
            <input
              id="item-search"
              type="search"
              className="input"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {data ? (
            <span className="text-faint" style={{ fontSize: '0.8rem' }}>
              {fmtInt(data.dataset_total)} dataset · {fmtInt(data.manual_total)} manual
              {!activeUploadId ? ' · no active dataset' : ''}
            </span>
          ) : null}
        </div>
        <Button
          variant="accent"
          icon={<PackagePlus size={16} />}
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Add manual item
        </Button>
      </div>

      {loading ? <TableSkeleton rows={6} cols={6} /> : null}
      {!loading && error ? <ErrorState title="Items could not be loaded" description={error} onRetry={reload} /> : null}

      {!loading && !error && data ? (
        data.items.length === 0 ? (
          <EmptyState
            compact
            title={debouncedSearch ? 'No items match this search' : 'This store has no items yet'}
            description={
              debouncedSearch
                ? 'Clear the search or try a different product name.'
                : activeUploadId
                  ? 'The active upload produced no rows. Check the dataset history for details.'
                  : 'Upload a CSV/XLSX dataset or add items manually.'
            }
            action={
              debouncedSearch ? (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Link to={`/upload?store_id=${storeId}`} className="btn btn-primary">
                  <UploadIcon size={16} aria-hidden="true" /> Upload dataset
                </Link>
              )
            }
          />
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              rows={data.items}
              rowKey={(r) => `${r.source}-${r.id}`}
              sort={sort}
              onSortChange={setSort}
              caption={`Items for store ${data.store_id}`}
              minWidth={860}
            />
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
              <Pagination
                page={data.page}
                pageSize={data.page_size}
                total={data.total}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s)
                  setPage(1)
                }}
              />
            </div>
          </div>
        )
      ) : null}

      <ManualItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        storeId={storeId}
        item={editing}
        onSaved={() => {
          reload()
          onItemsChanged()
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleteBusy}
        title="Delete manual item?"
        body={
          <>
            “{deleting?.product_name}” will be removed from this store. Dataset rows cannot be deleted individually —
            they change only when you replace the upload.
          </>
        }
        confirmLabel="Delete item"
      />
    </div>
  )
}

function ExpiryTab({ metrics }: { metrics: StoreMetrics | null }) {
  if (!metrics) return <ErrorState compact title="Metrics are still loading or unavailable" />
  const exp = metrics.expiry
  if (!exp || !exp.available) {
    return (
      <DegradedBanner title="Expiry analytics are unavailable for this store">
        {exp?.unavailable_reason || 'The active dataset does not include an expiry date column.'} Upload a dataset
        with an expiry/expiration column to enable expiry bands, shelf-life histograms and most-expiring rankings.
      </DegradedBanner>
    )
  }
  const bands = Object.entries(exp.bands_histogram || {}).map(([band, rows]) => ({ band, rows: Number(rows) }))
  const expiredByCat = Object.entries(exp.expired_by_category || {}).sort((a, b) => Number(b[1]) - Number(a[1]))

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <StatCard label="Anchor date" value={fmtDate(exp.anchor_date)} note="Everything is measured from here" icon={<ShieldCheck size={16} />} />
        <StatCard label="Expired rows" value={fmtInt(exp.total_expired_rows)} tone="bad" note="Expiry before anchor" icon={<TriangleAlert size={16} />} />
        <StatCard label="Rows in window" value={fmtInt(exp.items)} tone="brand" note="With usable expiry dates" icon={<Layers size={16} />} />
        <StatCard
          label="Most exposed"
          value={exp.most_expiring?.[0]?.item ?? '—'}
          note={exp.most_expiring?.[0] ? `${fmtInt(exp.most_expiring[0].rows)} rows · ${exp.most_expiring[0].risk_band}` : '—'}
          tone="coral"
          icon={<TriangleAlert size={16} />}
        />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <SectionHeading title="Expiry bands" description="Row counts grouped by risk band, relative to the anchor date." />
          <div style={{ height: 240, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bands} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                <Bar dataKey="rows" radius={[6, 6, 0, 0]}>
                  {bands.map((b) => (
                    <Cell key={b.band} fill={BAND_COLORS[b.band] || '#226192'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <SectionHeading title="Expired rows by category" description="Where expired stock concentrates." />
          <div className="stack" style={{ gap: 9, marginTop: 14 }}>
            {expiredByCat.length ? (
              expiredByCat.map(([cat, n]) => {
                const max = Number(expiredByCat[0][1]) || 1
                return (
                  <div key={cat}>
                    <div className="row-between" style={{ fontSize: '0.82rem', marginBottom: 4 }}>
                      <span className="truncate">{cat}</span>
                      <span className="text-secondary">{fmtInt(n)}</span>
                    </div>
                    <div className="meter">
                      <span style={{ width: `${Math.max(4, (Number(n) / max) * 100)}%`, background: '#ef8557' }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-faint">No expired rows recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '16px 16px 4px' }}>
          <SectionHeading title="Most expiring items" description="Ranked by the number of rows at risk." />
        </div>
        <DataTable
          minWidth={760}
          columns={[
            { key: 'item', header: 'Item', render: (r: NonNullable<StoreMetrics['expiry']['most_expiring']>[number]) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
            { key: 'category', header: 'Category', render: (r) => r.category || <span className="text-faint">—</span> },
            { key: 'rows', header: 'Rows', align: 'right', render: (r) => fmtInt(r.rows) },
            { key: 'rows_expired', header: 'Expired', align: 'right', render: (r) => fmtInt(r.rows_expired) },
            {
              key: 'risk_band',
              header: 'Risk band',
              render: (r) => <StatusBadge tone={toneFromRisk(r.risk_band)}>{r.risk_band || '—'}</StatusBadge>,
            },
            { key: 'shelf_life_avg', header: 'Avg shelf life', align: 'right', render: (r) => (r.shelf_life_avg == null ? '—' : `${fmtNum(r.shelf_life_avg, 1)} d`) },
          ]}
          rows={(exp.most_expiring || []).slice(0, 25)}
          rowKey={(r, i) => r.item + i}
          caption="Most expiring items"
        />
      </div>
    </div>
  )
}

function SalesTab({ metrics }: { metrics: StoreMetrics | null }) {
  if (!metrics) return <ErrorState compact title="Metrics are still loading or unavailable" />
  const s = metrics.sales
  if (!s || !s.available) {
    return (
      <DegradedBanner title="Sales analytics are unavailable for this store">
        {s?.unavailable_reason || 'The active dataset does not include a units-sold column.'} Upload a dataset with a
        sales/units-sold column to unlock rankings, sell-through and category mix.
      </DegradedBanner>
    )
  }
  const top = (s.top_sellers || []).slice(0, 10)
  const low = (s.low_sellers || []).slice(0, 10)

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <StatCard label="Total units sold" value={fmtInt(s.total_units)} note="Across the analysis window" icon={<TrendingUp size={16} />} />
        <StatCard label="Sell-through" value={fmtPct(s.sell_through)} tone="ok" note="Units sold vs movement" icon={<ShieldCheck size={16} />} />
        <StatCard
          label="Top seller"
          value={s.top_sellers?.[0]?.item ?? '—'}
          note={s.top_sellers?.[0] ? `${fmtInt(s.top_sellers[0].total_units)} units` : '—'}
          tone="brand"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Total profit"
          value={s.profit?.available ? fmtMoney(s.profit.total_profit) : '—'}
          note={s.profit?.available ? 'Revenue minus cost' : s.profit?.unavailable_reason || 'Cost column missing'}
          tone={s.profit?.available ? 'ok' : 'warn'}
          icon={<TrendingDown size={16} />}
        />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <SectionHeading title="Units by month" description="Monthly sales movement from the dataset." />
          <div style={{ height: 240, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.monthly_series || []} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="units" stroke="#226192" strokeWidth={2.5} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <SectionHeading title="Category mix" description="Units sold per category." />
          <div className="stack" style={{ gap: 9, marginTop: 14 }}>
            {Object.entries(s.by_category || {})
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .map(([cat, units]) => {
                const max = Math.max(...Object.values(s.by_category || {}).map(Number), 1)
                return (
                  <div key={cat}>
                    <div className="row-between" style={{ fontSize: '0.82rem', marginBottom: 4 }}>
                      <span className="truncate">{cat}</span>
                      <span className="text-secondary">{fmtInt(units)}</span>
                    </div>
                    <div className="meter">
                      <span style={{ width: `${Math.max(4, (Number(units) / max) * 100)}%`, background: '#226192' }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {[
          { title: 'Top sellers', desc: 'Highest movement in the window.', rows: top, tone: 'good' as const },
          { title: 'Low sellers', desc: 'Bottom quartile — candidates for markdown or delisting.', rows: low, tone: 'warning' as const },
        ].map((sec) => (
          <div className="card" key={sec.title}>
            <div style={{ padding: '16px 16px 4px' }}>
              <SectionHeading title={sec.title} description={sec.desc} />
            </div>
            <DataTable
              minWidth={480}
              columns={[
                { key: 'rank', header: '#', width: '44px', render: (r) => <span className="text-faint">{r.rank}</span> },
                { key: 'item', header: 'Item', render: (r) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
                { key: 'total_units', header: 'Units', align: 'right', render: (r) => fmtInt(r.total_units) },
                { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => (r.revenue == null ? '—' : fmtMoney(r.revenue)) },
                {
                  key: 'sell_through',
                  header: 'Sell-through',
                  align: 'right',
                  render: (r) => (r.sell_through == null ? '—' : fmtPct(r.sell_through)),
                },
              ]}
              rows={sec.rows}
              rowKey={(r, i) => r.item + i}
              caption={sec.title}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function OrdersTab({ storeId, metrics }: { storeId: number; metrics: StoreMetrics | null }) {
  const [showAll, setShowAll] = useState(false)
  if (!metrics) return <ErrorState compact title="Metrics are still loading or unavailable" />
  const o = metrics.orders
  if (!o || !o.available) {
    return (
      <DegradedBanner title="Reorder recommendations are unavailable for this store">
        {o?.unavailable_reason || 'Stock and sales movement are required to compute reorder points.'} Map stock and
        units-sold columns (or add manual items) to enable reorder calculations.
      </DegradedBanner>
    )
  }
  const rows = showAll ? o.items.slice(0, 200) : o.next_batch.slice(0, 50)

  const cols: Column<(typeof o.items)[number]>[] = [
    { key: 'item', header: 'Item', render: (r) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
    { key: 'category', header: 'Category', render: (r) => r.category || <span className="text-faint">—</span> },
    { key: 'current_stock', header: 'In stock', align: 'right', render: (r) => fmtInt(r.current_stock) },
    { key: 'reorder_point', header: 'Reorder pt', align: 'right', render: (r) => fmtInt(r.reorder_point) },
    { key: 'safety_stock', header: 'Safety', align: 'right', render: (r) => fmtInt(r.safety_stock) },
    { key: 'avg_daily', header: 'Avg/day', align: 'right', render: (r) => fmtNum(r.avg_daily, 2) },
    {
      key: 'recommended_qty',
      header: 'Order qty',
      align: 'right',
      render: (r) => <strong>{fmtInt(r.recommended_qty)}</strong>,
    },
    {
      key: 'est_cost',
      header: 'Est. cost',
      align: 'right',
      render: (r) => (r.est_cost == null ? <span className="text-faint">—</span> : fmtMoney(r.est_cost, true)),
    },
    {
      key: 'formula_source',
      header: 'Formula',
      render: (r) => (
        <StatusBadge tone="info" title={`Estimated cost basis: ${r.est_cost_basis}`}>
          {r.formula_source}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="grid grid-4">
        <StatCard label="Items to order" value={fmtInt(o.totals.items_to_order)} note="Next batch" tone="coral" icon={<ShoppingCart size={16} />} />
        <StatCard label="Units in batch" value={fmtInt(o.totals.total_units)} note="Total recommended quantity" icon={<Layers size={16} />} />
        <StatCard
          label="Estimated cost"
          value={o.totals.total_est_cost == null ? '—' : fmtMoney(o.totals.total_est_cost)}
          note={`Basis: ${o.totals.est_cost_basis}`}
          tone="brand"
          icon={<ShieldCheck size={16} />}
        />
        <StatCard
          label="Full list"
          value={fmtInt(o.items.length)}
          note="Items below reorder point"
          icon={<Database size={16} />}
        />
      </div>

      <div className="card card-pad">
        <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
          <SectionHeading
            title="Next batch"
            description="Every line shows its arithmetic: reorder point = avg daily demand × (lead time + safety)."
          />
          <div className="row" style={{ gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show next batch only' : `Show all ${fmtInt(o.items.length)} lines`}
            </Button>
            <a className="btn btn-secondary btn-sm" href={`/api/stores/${storeId}/order-list?format=csv`} download>
              <Download size={14} aria-hidden="true" /> Export CSV
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                downloadCsv(
                  `order-list-store-${storeId}.csv`,
                  rows.map((r) => ({
                    item: r.item,
                    category: r.category ?? '',
                    current_stock: r.current_stock,
                    reorder_point: r.reorder_point,
                    safety_stock: r.safety_stock,
                    avg_daily: r.avg_daily,
                    recommended_qty: r.recommended_qty,
                    formula_source: r.formula_source,
                    est_cost: r.est_cost ?? '',
                    est_cost_basis: r.est_cost_basis,
                  })),
                )
              }}
            >
              Copy to CSV locally
            </Button>
          </div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {Object.entries(o.by_formula_source).map(([src, n]) => (
            <span className="chip" key={src}>
              {src} · {fmtInt(n)}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <DataTable columns={cols} rows={rows} rowKey={(r, i) => r.item + i} caption="Reorder recommendations" minWidth={980} />
        {rows.length < o.items.length ? (
          <div className="text-faint" style={{ padding: '10px 16px', fontSize: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
            Showing {fmtInt(rows.length)} of {fmtInt(o.items.length)} lines — switch to the full list to see them all.
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DataTab({ store, onReloadStore }: { store: StoreRecord; onReloadStore: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const remove = async () => {
    setBusy(true)
    try {
      await storesApi.remove(store.id)
      toast.success(`Store “${store.name}” deleted`)
      navigate('/stores')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the store.'))
      setBusy(false)
      setConfirm(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card card-pad">
        <SectionHeading
          title="Active dataset"
          description="The upload currently powering this store's analytics."
          actions={
            <div className="row" style={{ gap: 8 }}>
              <Link to={`/upload?store_id=${store.id}`} className="btn btn-primary btn-sm">
                <UploadIcon size={14} aria-hidden="true" /> {store.active_upload_id ? 'Replace dataset' : 'Attach dataset'}
              </Link>
              <Link to={`/history?store_id=${store.id}`} className="btn btn-secondary btn-sm">
                Upload history
              </Link>
            </div>
          }
        />
        {store.active_upload_id ? (
          <div className="text-secondary" style={{ fontSize: '0.88rem', marginTop: 12, lineHeight: 1.7 }}>
            Upload <strong>#{store.active_upload_id}</strong> is active. Open the data-health screen for row counts,
            validation profiles, per-row issues and the cleaned CSV export.
          </div>
        ) : (
          <DegradedBanner title="No dataset attached" onRetry={onReloadStore}>
            This store currently only contains manual items. Upload a CSV or XLSX file to enable expiry, sales and
            reorder analytics.
          </DegradedBanner>
        )}
      </div>

      <div className="card card-pad">
        <SectionHeading title="Danger zone" description="Deleting a store removes its items, uploads and metrics." />
        <div className="row-between" style={{ marginTop: 14, gap: 12, flexWrap: 'wrap' }}>
          <div className="text-secondary" style={{ fontSize: '0.86rem' }}>
            This cannot be undone. Uploads belonging to this store are removed with it.
          </div>
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirm(true)}>
            Delete store
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => void remove()}
        loading={busy}
        title={`Delete “${store.name}”?`}
        body="All items, datasets and metrics for this store will be permanently deleted."
        confirmLabel="Delete permanently"
      />
    </div>
  )
}

/* ───────────────────────── Page ───────────────────────── */

export default function StoreDetail() {
  const { storeId } = useParams()
  const id = Number(storeId)
  const [tab, setTab] = useQueryParam('tab', 'overview')
  const [metricsNonce, setMetricsNonce] = useState(0)

  const validId = Number.isInteger(id) && id > 0

  const storeQ = useApi<StoreRecord>(() => storesApi.get(id), [id], {
    validate: (d): d is StoreRecord => typeof d === 'object' && d !== null && 'name' in d,
  })
  const metricsQ = useApi<StoreMetrics>(() => storesApi.metrics(id), [id, metricsNonce], {
    validate: (d): d is StoreMetrics =>
      typeof d === 'object' && d !== null && 'capabilities' in d && 'expiry' in d,
  })

  const reloadAll = useCallback(() => {
    storeQ.reload()
    metricsQ.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshMetrics = () => setMetricsNonce((n) => n + 1)

  if (!validId) {
    return (
      <ErrorState
        title="Invalid store id"
        description="The address does not contain a valid store identifier."
        action={
          <Link to="/stores" className="btn btn-secondary">
            <ArrowLeft size={15} aria-hidden="true" /> Back to stores
          </Link>
        }
      />
    )
  }

  if (storeQ.loading && !storeQ.data) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <div className="skeleton" style={{ height: 34, width: '38%' }} />
        <div className="skeleton" style={{ height: 18, width: '58%' }} />
        <TableSkeleton rows={5} cols={5} />
      </div>
    )
  }

  if (storeQ.error && !storeQ.data) {
    return (
      <ErrorState
        title="Store could not be loaded"
        description={storeQ.error}
        onRetry={reloadAll}
        action={
          <Link to="/stores" className="btn btn-secondary">
            <ArrowLeft size={15} aria-hidden="true" /> Back to stores
          </Link>
        }
      />
    )
  }

  const store = storeQ.data!
  const metrics = metricsQ.data

  return (
    <div>
      <PageHeader
        title={store.name}
        subtitle={
          <span className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {store.city ? <span>{store.city}</span> : null}
            <span>Lead {store.lead_time_days} d</span>
            <span>Safety {store.safety_days} d</span>
            {store.active_upload_id ? (
              <StatusBadge tone="success">Dataset #{store.active_upload_id}</StatusBadge>
            ) : (
              <StatusBadge tone="warning">No dataset</StatusBadge>
            )}
          </span>
        }
        breadcrumb={[{ label: 'Stores', to: '/stores' }, { label: store.name }]}
        actions={
          <>
            <Link to="/compare" className="btn btn-secondary">
              <Scale size={16} aria-hidden="true" /> Compare
            </Link>
            <Link to={`/upload?store_id=${store.id}`} className="btn btn-accent">
              <UploadIcon size={16} aria-hidden="true" /> Upload
            </Link>
          </>
        }
      />

      <div className="tabs" role="tablist" aria-label="Store sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`tabpanel-${t.id}`}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {metricsQ.error && !metrics ? (
        <div style={{ marginTop: 14 }}>
          <DegradedBanner title="Store metrics are unavailable" onRetry={refreshMetrics} tone="info">
            {metricsQ.error} Sections below will show unavailable states until metrics load.
          </DegradedBanner>
        </div>
      ) : null}

      <div
        role="tabpanel"
        id={`tabpanel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        style={{ marginTop: 16 }}
        tabIndex={-1}
      >
        {tab === 'overview' ? <OverviewTab store={store} metrics={metrics} /> : null}
        {tab === 'items' ? (
          <ItemsTab
            storeId={store.id}
            activeUploadId={store.active_upload_id}
            onItemsChanged={refreshMetrics}
          />
        ) : null}
        {tab === 'expiry' ? <ExpiryTab metrics={metrics} /> : null}
        {tab === 'sales' ? <SalesTab metrics={metrics} /> : null}
        {tab === 'orders' ? <OrdersTab storeId={store.id} metrics={metrics} /> : null}
        {tab === 'data' ? <DataTab store={store} onReloadStore={reloadAll} /> : null}
      </div>

      <div className="text-faint" style={{ marginTop: 22, fontSize: '0.76rem' }}>
        <span className="row" style={{ gap: 6 }}>
          <StoreIcon size={12} aria-hidden="true" /> Store #{store.id}
          {metrics?.computed_at ? ` · metrics computed ${fmtDateTime(metrics.computed_at)}` : ''}
        </span>
      </div>
    </div>
  )
}
