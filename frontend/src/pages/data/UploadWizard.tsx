import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Database, MapPin, TriangleAlert, Upload as UploadIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiErrorMessage, datasetApi, storesApi } from '../../lib/api'
import { useApi, useQueryParam } from '../../lib/hooks'
import type { StoreRecord } from '../../lib/types'
import { PageHeader, SectionHeading } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { StatCard } from '../../components/ui/Metrics'
import Button from '../../components/ui/Button'
import { SelectField, TextInput } from '../../components/ui/Forms'
import DatasetLinks from '../../components/DatasetLinks'
import { bytesToSize, fmtInt } from '../../lib/format'

const MAX_BYTES = 25 * 1024 * 1024

const SEMANTICS: { key: string; label: string; required?: boolean; hint?: string }[] = [
  { key: 'product_name', label: 'Product name', required: true, hint: 'The only column the API requires.' },
  { key: 'product_id', label: 'Product ID / SKU' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock' },
  { key: 'reorder_level', label: 'Reorder level' },
  { key: 'reorder_quantity', label: 'Reorder quantity' },
  { key: 'unit_price', label: 'Unit price' },
  { key: 'unit_cost', label: 'Unit cost' },
  { key: 'units_sold', label: 'Units sold (sales)' },
  { key: 'expiry_date', label: 'Expiry date' },
  { key: 'received_date', label: 'Received date' },
  { key: 'last_order_date', label: 'Last order date' },
  { key: 'lead_time_days', label: 'Lead time (days)' },
  { key: 'store_filter_column', label: 'Store filter column', hint: 'Lets one file serve several stores via a row filter.' },
]

const PRODUCT_NAME_ALIASES = ['productname', 'name', 'item', 'product', 'itemname', 'description']

function normHeader(h: string): string {
  return h.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function parseCsvHeaderLine(text: string): string[] | null {
  let t = text
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1)
  let inQ = false
  let end = -1
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ch === '"') {
      if (inQ && t[i + 1] === '"') {
        i++
        continue
      }
      inQ = !inQ
      continue
    }
    if (!inQ && (ch === '\n' || ch === '\r')) {
      end = i
      break
    }
  }
  if (end === -1) end = t.length
  const line = t.slice(0, end)
  const cells: string[] = []
  let cur = ''
  inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQ = !inQ
      continue
    }
    if (ch === ',' && !inQ) {
      cells.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  cells.push(cur.trim())
  return cells.filter((c) => c !== '').length ? cells : null
}

type UploadResult = {
  duplicate?: boolean
  upload?: { id: number; filename: string; row_count: number; rows_matched: number; rows_discarded: number; parse_errors: number; uploaded_at: string }
  suggested_mapping?: Record<string, string | null>
  warnings?: string[]
  rows_matched?: number
  rows_discarded?: number
  parse_errors?: number
  date_formats?: string[]
}

export default function UploadWizard() {
  const navigate = useNavigate()
  const [storeIdParam] = useQueryParam('store_id', '')
  const storesQ = useApi<StoreRecord[]>(() => storesApi.getAll(), [], { validate: Array.isArray })

  const [step, setStep] = useState(1)
  const [storeId, setStoreId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [header, setHeader] = useState<string[] | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [filterColumn, setFilterColumn] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (storeIdParam && !storeId) setStoreId(storeIdParam)
  }, [storeIdParam, storeId])

  const isCsv = file?.name.toLowerCase().endsWith('.csv') ?? false
  const totalSteps = isCsv ? 4 : 3

  const productMapped = useMemo(() => {
    if (!header) return true // unknown (xlsx) — server decides
    const chosen = mapping.product_name
    if (chosen && chosen !== '') return true
    const normed = header.map(normHeader)
    return normed.some((h) => PRODUCT_NAME_ALIASES.includes(h) || (h.length >= 4 && PRODUCT_NAME_ALIASES.some((a) => h.includes(a))))
  }, [header, mapping])

  const acceptFile = async (f: File | null | undefined) => {
    if (!f) return
    setFileError(null)
    setResult(null)
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      setFileError('Only .csv and .xlsx files are accepted by the API.')
      setFile(null)
      setHeader(null)
      return
    }
    if (f.size > MAX_BYTES) {
      setFileError(`The file is ${bytesToSize(f.size)}; the limit is 25 MB.`)
      setFile(null)
      setHeader(null)
      return
    }
    setFile(f)
    setMapping({})
    setFilterColumn('')
    setFilterValue('')
    if (f.name.toLowerCase().endsWith('.csv')) {
      try {
        const slice = f.slice(0, 131072)
        const text = await slice.text()
        setHeader(parseCsvHeaderLine(text))
      } catch {
        setHeader(null)
      }
    } else {
      setHeader(null)
    }
  }

  const canNext1 = Boolean(storeId && file)
  const canNext2 = isCsv ? Boolean(header && productMapped) : true

  const doUpload = async () => {
    if (!file || !storeId) return
    setUploading(true)
    setUploadError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('store_id', storeId)
    const clientMapping: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(mapping)) {
      if (v === '__none__') clientMapping[k] = null
      else if (v) clientMapping[k] = v
    }
    if (Object.keys(clientMapping).length) form.append('mapping', JSON.stringify(clientMapping))
    if (filterColumn && filterValue) {
      form.append('filter', JSON.stringify({ column: filterColumn, value: filterValue }))
    }
    try {
      const res = await datasetApi.upload(form)
      const data = res.data as UploadResult
      setResult(data)
      setStep(isCsv ? 4 : 3)
      if (data.duplicate) {
        toast('This exact file was already uploaded for this store.', { icon: 'ℹ️' })
      } else {
        toast.success(`Upload accepted — ${fmtInt(data.rows_matched)} rows matched`)
      }
    } catch (err) {
      setUploadError(apiErrorMessage(err, 'The upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setFile(null)
    setHeader(null)
    setMapping({})
    setFilterColumn('')
    setFilterValue('')
    setResult(null)
    setUploadError(null)
    setFileError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (storesQ.loading) return <div className="skeleton" style={{ height: 120 }} />
  if (storesQ.error)
    return <ErrorState title="Stores could not be loaded" description={storesQ.error} onRetry={storesQ.reload} />
  if (storesQ.data && storesQ.data.length === 0)
    return (
      <EmptyState
        title="Create a store first"
        description="Datasets are always attached to a store. Add one, then come back to upload."
        action={
          <Link to="/stores/new" className="btn btn-primary">
            Add store
          </Link>
        }
      />
    )

  const stores = storesQ.data || []
  const activeStore = stores.find((s) => String(s.id) === storeId)

  if (result) {
    const up = result.upload
    return (
      <div style={{ maxWidth: 860 }}>
        <PageHeader
          title={result.duplicate ? 'File already uploaded' : 'Upload complete'}
          subtitle={
            result.duplicate
              ? 'The API detected an identical file (same SHA-256) for this store and reused the existing upload.'
              : 'The dataset is now the active upload for this store. Analytics were recomputed on the server.'
          }
          breadcrumb={[{ label: 'Data health', to: '/history' }, { label: 'Upload result' }]}
        />
        <div className="grid grid-3" style={{ marginBottom: 18 }}>
          <StatCard label="Rows matched" value={fmtInt(result.rows_matched ?? up?.rows_matched)} note="Passed the parser" tone="ok" icon={<Check size={16} />} />
          <StatCard
            label="Rows discarded"
            value={fmtInt(result.rows_discarded ?? up?.rows_discarded)}
            note={filterValue ? 'Removed by your filter' : 'No filter applied'}
            tone={(result.rows_discarded ?? up?.rows_discarded) ? 'warn' : 'brand'}
            icon={<TriangleAlert size={16} />}
          />
          <StatCard
            label="Parse errors"
            value={fmtInt(result.parse_errors ?? up?.parse_errors)}
            note="Cells that could not be converted"
            tone={(result.parse_errors ?? up?.parse_errors) ? 'coral' : 'brand'}
            icon={<Database size={16} />}
          />
        </div>

        {result.warnings?.length ? (
          <div className="degraded-banner info" style={{ marginBottom: 18 }} role="status">
            <TriangleAlert size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
            <div>
              <strong>Warnings</strong>
              <ul style={{ margin: '6px 0 0 16px' }}>
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {result.date_formats && result.date_formats.length > 1 ? (
          <p className="text-secondary" style={{ fontSize: '0.86rem', marginBottom: 14 }}>
            Mixed date formats detected: {result.date_formats.join(', ')}. The parser normalised what it could.
          </p>
        ) : null}

        {result.suggested_mapping ? (
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <SectionHeading title="Mapping used" description="Server-side resolution of your columns to store semantics." />
            <div className="capability-row" style={{ marginTop: 12 }}>
              {Object.entries(result.suggested_mapping)
                .filter(([k, v]) => !k.startsWith('_') && v)
                .map(([k, v]) => (
                  <span className="chip chip-on" key={k}>
                    <Check size={12} aria-hidden="true" /> {k}: {String(v)}
                  </span>
                ))}
            </div>
          </div>
        ) : null}

        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          {activeStore ? (
            <Button onClick={() => navigate(`/stores/${activeStore.id}`)} icon={<ArrowRight size={16} />}>
              Open store analytics
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => navigate(`/history${storeId ? `?store_id=${storeId}` : ''}`)}>
            View upload history
          </Button>
          <Button variant="ghost" onClick={reset}>
            Upload another file
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <PageHeader
        title="Upload dataset"
        subtitle="CSV or XLSX, up to 25 MB and 200k rows. The first sheet / full file is imported; only a product name column is required."
        breadcrumb={[{ label: 'Data health', to: '/history' }, { label: 'Upload' }]}
      />

      <div className="stepper" aria-label={`Step ${step} of ${totalSteps}`}>
        {[
          { n: 1, label: 'Store & file' },
          ...(isCsv ? [{ n: 2, label: 'Column mapping' }] : []),
          { n: isCsv ? 3 : 2, label: 'Review & upload' },
          { n: isCsv ? 4 : 3, label: 'Result' },
        ].map((s, i, arr) => (
          <span key={s.n} className="row" style={{ gap: 8 }}>
            <span className={`step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
              <span className="n">{step > s.n ? <Check size={12} /> : s.n}</span>
              {s.label}
            </span>
            {i < arr.length - 1 ? <span className="step-sep" aria-hidden="true" /> : null}
          </span>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 ? (
        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <SelectField
              label="Store"
              required
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              hint="The upload becomes this store's active dataset."
              options={[
                { value: '', label: stores.length ? 'Choose a store…' : 'No stores available' },
                ...stores.map((s) => ({
                  value: String(s.id),
                  label: `${s.name}${s.city ? ` · ${s.city}` : ''}${s.active_upload_id ? ` (has dataset #${s.active_upload_id})` : ''}`,
                })),
              ]}
            />
          </div>

          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Choose a CSV or XLSX file"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void acceptFile(e.dataTransfer.files?.[0])
            }}
          >
            <span className="dz-icon" aria-hidden="true">
              <UploadIcon size={22} />
            </span>
            <h3>{file ? file.name : 'Drop a file here, or click to browse'}</h3>
            <p>
              {file
                ? `${bytesToSize(file.size)}${header ? ` · ${header.length} columns detected` : ' · headers are read by the server'}`
                : 'Accepted formats: .csv and .xlsx · max 25 MB · max 200,000 rows · max 200 columns'}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(e) => void acceptFile(e.target.files?.[0])}
            />
          </div>

          {fileError ? (
            <div className="degraded-banner" role="alert">
              <TriangleAlert size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
              <div>{fileError}</div>
            </div>
          ) : null}

          <DatasetLinks />

          <div className="row" style={{ gap: 12 }}>
            <Button onClick={() => setStep(isCsv ? 2 : 2)} disabled={!canNext1}>
              Continue <ArrowRight size={16} />
            </Button>
            <Link to="/stores" className="btn btn-ghost">
              <ArrowLeft size={16} aria-hidden="true" /> Cancel
            </Link>
          </div>
        </div>
      ) : null}

      {/* Step 2 — mapping (CSV only) */}
      {step === 2 && isCsv ? (
        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <SectionHeading
              title="Map columns"
              description="Leave a field on “auto” to accept the server's suggestion. Choose “Not mapped” to ignore a suggested column."
            />
            {header ? (
              <div className="table-wrap" style={{ marginTop: 14 }}>
                <table className="table mapping-table">
                  <thead>
                    <tr>
                      <th>Store field</th>
                      <th>Source column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEMANTICS.map((sem) => (
                      <tr key={sem.key}>
                        <td>
                          <div className="semantic" style={{ fontWeight: 700 }}>
                            {sem.label}
                            {sem.required ? <span className="req"> *</span> : null}
                          </div>
                          {sem.hint ? (
                            <div className="text-faint" style={{ fontSize: '0.74rem', marginTop: 2 }}>
                              {sem.hint}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <select
                            className="select"
                            aria-label={`Source column for ${sem.label}`}
                            value={mapping[sem.key] ?? ''}
                            onChange={(e) => setMapping((m) => ({ ...m, [sem.key]: e.target.value }))}
                          >
                            <option value="">Auto (server suggestion)</option>
                            <option value="__none__">Not mapped — ignore</option>
                            {header.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-faint">Header could not be read client-side; the server will auto-map.</p>
            )}
            {!productMapped ? (
              <div className="degraded-banner" role="alert" style={{ marginTop: 14 }}>
                <TriangleAlert size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
                <div>
                  No product name column was detected. Map one explicitly or the upload will be rejected with
                  “Header/schema mismatch”.
                </div>
              </div>
            ) : null}
          </div>

          <div className="card card-pad">
            <SectionHeading
              title="Optional row filter"
              description="Import only the rows of a multi-store file that match one value (minimum 50 matching rows)."
            />
            <div className="grid grid-2" style={{ marginTop: 14 }}>
              <SelectField
                label="Filter column"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                options={[
                  { value: '', label: 'No filter — import every row' },
                  ...(header || []).map((h) => ({ value: h, label: h })),
                ]}
              />
              <TextInput
                label="Value to keep"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="e.g. Store A"
                disabled={!filterColumn}
                hint="Rows whose cell differs are discarded and reported."
              />
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <Button onClick={() => setStep(3)} disabled={!canNext2}>
              Review <ArrowRight size={16} />
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 2 (xlsx) / 3 (csv) — review & upload */}
      {step === (isCsv ? 3 : 2) ? (
        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <SectionHeading title="Review" description="Nothing is written until you press Upload." />
            <dl className="kv-list" style={{ marginTop: 14 }}>
              <div>
                <dt>Store</dt>
                <dd>{activeStore ? `${activeStore.name}${activeStore.city ? ` · ${activeStore.city}` : ''}` : storeId}</dd>
              </div>
              <div>
                <dt>File</dt>
                <dd>{file?.name}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{file ? bytesToSize(file.size) : '—'}</dd>
              </div>
              {header ? (
                <div>
                  <dt>Columns</dt>
                  <dd>{header.length}</dd>
                </div>
              ) : null}
              {isCsv && filterColumn && filterValue ? (
                <div>
                  <dt>Filter</dt>
                  <dd>
                    {filterColumn} = “{filterValue}”
                  </dd>
                </div>
              ) : null}
              {!isCsv ? (
                <div>
                  <dt>Mapping</dt>
                  <dd>Auto-detected server-side (XLSX headers are not previewed in the browser)</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {uploadError ? (
            <div className="degraded-banner" role="alert">
              <TriangleAlert size={16} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
              <div>
                <strong>Upload rejected</strong>
                <div style={{ marginTop: 3 }}>{uploadError}</div>
              </div>
            </div>
          ) : null}

          <div className="row" style={{ gap: 12 }}>
            <Button onClick={() => void doUpload()} loading={uploading} icon={<UploadIcon size={16} />} size="lg">
              Upload dataset
            </Button>
            {isCsv ? (
              <Button variant="ghost" onClick={() => setStep(2)} disabled={uploading}>
                <ArrowLeft size={16} /> Back to mapping
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setStep(1)} disabled={uploading}>
                <ArrowLeft size={16} /> Back
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="text-faint" style={{ marginTop: 26, fontSize: '0.78rem', lineHeight: 1.6 }}>
        <MapPin size={11} aria-hidden="true" /> Uploads are stored in PostgreSQL under the{' '}
        <code>dataset</code> schema. Identical files (same hash) for the same store are detected and skipped.
        Previous uploads remain in history — the newest successful upload becomes active.
      </div>
    </div>
  )
}
