import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Download, Eye, HardDrive, ShieldCheck, Trash2, TriangleAlert, Upload as UploadIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiErrorMessage, datasetApi, storesApi } from '../../lib/api'
import { useApi } from '../../lib/hooks'
import type { StoreRecord, UploadRecord } from '../../lib/types'
import { PageHeader, SectionHeading } from '../../components/ui/PageHeader'
import { DegradedBanner, EmptyState, ErrorState, TableSkeleton } from '../../components/ui/States'
import { StatCard, StatusBadge } from '../../components/ui/Metrics'
import DataTable from '../../components/ui/Table'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/Forms'
import DatasetLinks from '../../components/DatasetLinks'
import { bytesToSize, fmtDateTime, fmtInt, fmtRelative } from '../../lib/format'

interface DatasetHealth {
  storage: 'postgres' | 'degraded' | string
  uploads: number
}

interface UploadProfile {
  upload_id: number
  profile: {
    columns?: { name: string; null_count: number; distinct_count: number; min: unknown; max: unknown; avg: number | null }[]
    issue_counts?: Record<string, number>
    rows_with_issues?: number
    [key: string]: unknown
  }
  computed_at?: string
}

function ProfileModal({ upload, onClose }: { upload: UploadRecord | null; onClose: () => void }) {
  const uploadId = upload?.id
  const profileQ = useApi<UploadProfile>(
    () =>
      uploadId != null
        ? datasetApi.profile(uploadId)
        : Promise.resolve({ data: { upload_id: 0, profile: {} } as UploadProfile }),
    [uploadId],
    { validate: (d): d is UploadProfile => typeof d === 'object' && d !== null && 'profile' in d },
  )

  return (
    <Modal
      open={Boolean(upload)}
      onClose={onClose}
      size="lg"
      title={upload ? `Validation profile · upload #${upload.id}` : ''}
      subtitle={upload?.filename}
    >
      {profileQ.loading ? <div className="skeleton" style={{ height: 140 }} /> : null}
      {profileQ.error ? (
        <DegradedBanner title="Profile unavailable" onRetry={profileQ.reload}>
          {profileQ.error}
        </DegradedBanner>
      ) : null}
      {profileQ.data ? (
        <div className="stack" style={{ gap: 16 }}>
          {typeof profileQ.data.profile.rows_with_issues === 'number' ? (
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <span className="chip">
                Rows with issues: <strong>{fmtInt(profileQ.data.profile.rows_with_issues)}</strong>
              </span>
              {Object.entries(profileQ.data.profile.issue_counts || {}).map(([code, n]) => (
                <span className="chip chip-off" key={code} title={code}>
                  {code.replace(/_/g, ' ')} · {fmtInt(n)}
                </span>
              ))}
            </div>
          ) : null}

          {Array.isArray(profileQ.data.profile.columns) ? (
            <div>
              <SectionHeading title="Column statistics" description="Null counts and ranges per source column." />
              <div className="table-wrap" style={{ marginTop: 10 }}>
                <table className="table" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th className="num">Nulls</th>
                      <th className="num">Distinct</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th className="num">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileQ.data.profile.columns.map((c) => (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td className="num">{fmtInt(c.null_count)}</td>
                        <td className="num">{fmtInt(c.distinct_count)}</td>
                        <td>{c.min == null ? '—' : String(c.min)}</td>
                        <td>{c.max == null ? '—' : String(c.max)}</td>
                        <td className="num">{c.avg == null ? '—' : String(c.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.86rem' }}>Raw profile JSON</summary>
            <pre className="code-block" style={{ marginTop: 10, fontSize: '0.74rem', overflow: 'auto', maxHeight: 260 }}>
              {JSON.stringify(profileQ.data.profile, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </Modal>
  )
}

export default function DataHealth() {
  const [storeFilter, setStoreFilter] = useState(
    new URLSearchParams(window.location.search).get('store_id') || '',
  )
  const [profileUpload, setProfileUpload] = useState<UploadRecord | null>(null)
  const [deleting, setDeleting] = useState<UploadRecord | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const healthQ = useApi<DatasetHealth>(() => datasetApi.health(), [], {
    validate: (d): d is DatasetHealth => typeof d === 'object' && d !== null && 'storage' in d,
  })
  const storesQ = useApi<StoreRecord[]>(() => storesApi.getAll(), [], { validate: Array.isArray })
  const uploadsQ = useApi<UploadRecord[]>(
    () => datasetApi.uploads(storeFilter ? Number(storeFilter) : undefined),
    [storeFilter],
    { validate: Array.isArray },
  )

  const storeName = (id: number) => storesQ.data?.find((s) => s.id === id)?.name || `Store #${id}`

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await datasetApi.remove(deleting.id)
      toast.success(`Upload #${deleting.id} deleted`)
      setDeleting(null)
      uploadsQ.reload()
      healthQ.reload()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not delete the upload.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const uploads = uploadsQ.data || []
  const totalMatched = uploads.reduce((a, u) => a + (u.rows_matched || 0), 0)
  const totalDiscarded = uploads.reduce((a, u) => a + (u.rows_discarded || 0), 0)
  const totalErrors = uploads.reduce((a, u) => a + (u.parse_errors || 0), 0)

  return (
    <div>
      <PageHeader
        title="Data health"
        subtitle="Every dataset ever uploaded, with row counts, discard reasons, parse errors and per-column validation profiles."
        actions={
          <Link to="/upload" className="btn btn-primary">
            <UploadIcon size={16} aria-hidden="true" /> Upload dataset
          </Link>
        }
      >
        <div style={{ maxWidth: 320 }}>
          <SelectField
            label="Filter by store"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            options={[
              { value: '', label: 'All stores' },
              ...(storesQ.data || []).map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
        </div>
      </PageHeader>

      {healthQ.data && healthQ.data.storage === 'degraded' ? (
        <div style={{ marginBottom: 16 }}>
          <DegradedBanner title="Dataset storage is degraded" onRetry={healthQ.reload}>
            The API reports the <code>dataset</code> schema is unavailable. Uploads will fail until PostgreSQL
            storage is restored.
          </DegradedBanner>
        </div>
      ) : null}

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <StatCard
          label="Storage"
          value={healthQ.loading ? '…' : healthQ.data?.storage === 'postgres' ? 'PostgreSQL' : healthQ.error ? 'Unknown' : 'Degraded'}
          note={healthQ.data ? `${fmtInt(healthQ.data.uploads)} uploads stored` : '—'}
          tone={healthQ.data?.storage === 'postgres' ? 'ok' : 'warn'}
          icon={<HardDrive size={16} />}
        />
        <StatCard label="Uploads" value={fmtInt(uploads.length)} note={storeFilter ? 'Filtered by store' : 'Across all stores'} icon={<Database size={16} />} />
        <StatCard label="Rows matched" value={fmtInt(totalMatched)} note="Successfully parsed" tone="ok" icon={<ShieldCheck size={16} />} />
        <StatCard
          label="Issues"
          value={fmtInt(totalErrors)}
          note={`${fmtInt(totalDiscarded)} rows discarded`}
          tone={totalErrors ? 'bad' : 'brand'}
          icon={<TriangleAlert size={16} />}
        />
      </div>

      {uploadsQ.loading ? <TableSkeleton rows={5} cols={6} /> : null}
      {!uploadsQ.loading && uploadsQ.error ? (
        <ErrorState title="Upload history could not be loaded" description={uploadsQ.error} onRetry={uploadsQ.reload} />
      ) : null}

      {!uploadsQ.loading && !uploadsQ.error && uploads.length === 0 ? (
        <div className="stack" style={{ gap: 18 }}>
          <EmptyState
            icon={<UploadIcon size={20} />}
            title={storeFilter ? 'No uploads for this store yet' : 'No datasets uploaded yet'}
            description="Upload a CSV or XLSX export to give a store real analytics: expiry bands, sales rankings and reorder recommendations."
            action={
              <Link to={storeFilter ? `/upload?store_id=${storeFilter}` : '/upload'} className="btn btn-primary">
                <UploadIcon size={16} aria-hidden="true" /> Upload a dataset
              </Link>
            }
          />
          <DatasetLinks />
        </div>
      ) : null}

      {!uploadsQ.loading && !uploadsQ.error && uploads.length > 0 ? (
        <div className="card">
          <DataTable
            minWidth={940}
            columns={[
              {
                key: 'id',
                header: 'Upload',
                render: (u: UploadRecord) => (
                  <div>
                    <span style={{ fontWeight: 700 }}>#{u.id}</span>
                    <div className="truncate text-secondary" style={{ fontSize: '0.78rem', maxWidth: 260 }} title={u.filename}>
                      {u.filename}
                    </div>
                  </div>
                ),
              },
              {
                key: 'store',
                header: 'Store',
                render: (u) => <Link to={`/stores/${u.store_id}`}>{storeName(u.store_id)}</Link>,
              },
              { key: 'row_count', header: 'Rows', align: 'right', render: (u) => fmtInt(u.row_count) },
              {
                key: 'rows_matched',
                header: 'Matched',
                align: 'right',
                render: (u) => <span style={{ color: 'var(--success)' }}>{fmtInt(u.rows_matched)}</span>,
              },
              {
                key: 'rows_discarded',
                header: 'Discarded',
                align: 'right',
                render: (u) => (u.rows_discarded ? <span style={{ color: 'var(--warning)' }}>{fmtInt(u.rows_discarded)}</span> : '0'),
              },
              {
                key: 'parse_errors',
                header: 'Parse errors',
                align: 'right',
                render: (u) => (u.parse_errors ? <span style={{ color: 'var(--critical)' }}>{fmtInt(u.parse_errors)}</span> : '0'),
              },
              { key: 'size_bytes', header: 'Size', align: 'right', render: (u) => bytesToSize(u.size_bytes) },
              { key: 'uploaded_at', header: 'Uploaded', render: (u) => <span title={fmtDateTime(u.uploaded_at)}>{fmtRelative(u.uploaded_at)}</span> },
              {
                key: 'status',
                header: 'Status',
                render: (u) => <StatusBadge tone={u.status === 'ready' ? 'success' : 'warning'}>{u.status}</StatusBadge>,
              },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                render: (u) => (
                  <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" title="Validation profile" aria-label={`View profile for upload ${u.id}`} onClick={() => setProfileUpload(u)}>
                      <Eye size={14} />
                    </button>
                    <a className="icon-btn" title="Download cleaned CSV" aria-label={`Download cleaned CSV for upload ${u.id}`} href={datasetApi.exportUrl(u.id)} download>
                      <Download size={14} />
                    </a>
                    <button className="icon-btn" title="Delete upload" aria-label={`Delete upload ${u.id}`} onClick={() => setDeleting(u)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={uploads}
            rowKey={(u) => u.id}
            caption="Dataset upload history"
          />
        </div>
      ) : null}

      <ProfileModal upload={profileUpload} onClose={() => setProfileUpload(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        loading={deleteBusy}
        title={`Delete upload #${deleting?.id ?? ''}?`}
        body={
          <>
            “{deleting?.filename}” and its {fmtInt(deleting?.row_count)} rows will be removed. If this upload is the
            store's active dataset, the store falls back to its previous upload or to manual items only.
          </>
        }
        confirmLabel="Delete upload"
      />
    </div>
  )
}
