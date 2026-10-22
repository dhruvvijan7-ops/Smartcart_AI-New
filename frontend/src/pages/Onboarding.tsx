import { Link } from 'react-router-dom'
import { ArrowRight, Check, Database, Layers, ShieldCheck, Sparkles, Store as StoreIcon, Upload as UploadIcon, UserRound } from 'lucide-react'
import { compareApi, datasetApi, storesApi } from '../lib/api'
import { useApi } from '../lib/hooks'
import { useProfile } from '../context/ProfileContext'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import { CardSkeleton, DegradedBanner } from '../components/ui/States'
import { StatusBadge } from '../components/ui/Metrics'
import { fmtInt } from '../lib/format'

export default function Onboarding() {
  const { profile } = useProfile()
  const storesQ = useApi<{ id: number; name: string; active_upload_id: number | null }[]>(() => storesApi.getAll(), [], {
    validate: Array.isArray,
  })
  const healthQ = useApi<{ storage: string; uploads: number }>(() => datasetApi.health(), [], {
    validate: (d): d is { storage: string; uploads: number } => typeof d === 'object' && d !== null && 'storage' in d,
  })
  const compareQ = useApi<{ stores?: unknown[] }>(() => compareApi.getAll(), [], {
    validate: (d): d is { stores?: unknown[] } => typeof d === 'object' && d !== null && 'stores' in d,
  })

  const stores = storesQ.data || []
  const withData = stores.filter((s) => s.active_upload_id)
  const analyticsReady = (compareQ.data?.stores || []).length > 0

  const steps = [
    {
      done: Boolean(profile),
      title: 'Create a local display profile',
      desc: 'Optional. Stored only in this browser — the API has no account system.',
      action: profile ? null : { to: '/login', label: 'Open sign-in' },
      icon: <UserRound size={17} />,
    },
    {
      done: stores.length > 0,
      title: 'Add your first store',
      desc: stores.length ? `${stores.length} store${stores.length > 1 ? 's' : ''} in the workspace.` : 'Stores hold datasets, items and metrics.',
      action: stores.length ? { to: '/stores', label: 'View stores' } : { to: '/stores/new', label: 'Create a store' },
      icon: <StoreIcon size={17} />,
    },
    {
      done: withData.length > 0,
      title: 'Upload a CSV or XLSX dataset',
      desc:
        withData.length > 0
          ? `${withData.length} store${withData.length > 1 ? 's' : ''} now have an active upload.`
          : 'Only a product-name column is required. 25 MB / 200k row limits.',
      action: { to: '/upload', label: 'Upload dataset' },
      icon: <UploadIcon size={17} />,
    },
    {
      done: analyticsReady,
      title: 'Explore analytics & reorder lists',
      desc: analyticsReady
        ? 'Expiry bands, sales rankings and reorder arithmetic are live.'
        : 'Enabled automatically once a store has an analytics-ready dataset.',
      action: analyticsReady ? { to: '/analytics', label: 'Open analytics' } : { to: '/history', label: 'Check data health' },
      icon: <Sparkles size={17} />,
    },
    {
      done: false,
      title: 'Compare stores & export order lists',
      desc: 'Line up metrics side by side and export consolidated reorder CSVs.',
      action: { to: '/compare', label: 'Compare stores' },
      icon: <Layers size={17} />,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader
        title="Workspace setup"
        subtitle="A live checklist driven by the actual state of your API data — nothing here is simulated."
      />

      {storesQ.loading ? <CardSkeleton count={2} /> : null}

      {healthQ.data && healthQ.data.storage === 'degraded' ? (
        <div style={{ marginBottom: 16 }}>
          <DegradedBanner title="Dataset storage is degraded" onRetry={healthQ.reload}>
            Uploads will fail until the server's PostgreSQL dataset schema is restored.
          </DegradedBanner>
        </div>
      ) : null}

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
          <SectionHeading
            title={`Progress: ${doneCount} of ${steps.length - 1} core steps complete`}
            description="The last step is optional and repeatable."
          />
          <StatusBadge tone={doneCount >= 3 ? 'success' : 'warning'}>
            {doneCount >= 3 ? 'workspace ready' : 'setup incomplete'}
          </StatusBadge>
        </div>
        <div className="meter" style={{ marginTop: 14 }}>
          <span
            style={{
              width: `${Math.min(100, (doneCount / (steps.length - 1)) * 100)}%`,
              background: doneCount >= 3 ? 'var(--success)' : 'var(--brand)',
            }}
          />
        </div>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {steps.map((s, i) => (
          <div key={s.title} className="card card-pad row" style={{ gap: 14, alignItems: 'flex-start', opacity: s.done ? 0.85 : 1 }}>
            <span
              className="store-avatar"
              aria-hidden="true"
              style={s.done ? { background: 'var(--success-soft)', color: 'var(--success)' } : undefined}
            >
              {s.done ? <Check size={18} /> : s.icon}
            </span>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <strong>
                  {i + 1}. {s.title}
                </strong>
                <StatusBadge tone={s.done ? 'success' : 'neutral'}>{s.done ? 'done' : 'pending'}</StatusBadge>
              </div>
              <div className="text-secondary" style={{ fontSize: '0.86rem', marginTop: 4, lineHeight: 1.55 }}>
                {s.desc}
              </div>
            </div>
            {s.action ? (
              <Link to={s.action.to} className="btn btn-secondary btn-sm">
                {s.action.label} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <SectionHeading title="Live workspace facts" description="Read straight from the API on every load." />
        <dl className="kv-list" style={{ marginTop: 14 }}>
          <div>
            <dt>Stores</dt>
            <dd>{storesQ.loading ? '…' : fmtInt(stores.length)}</dd>
          </div>
          <div>
            <dt>Stores with active datasets</dt>
            <dd>{storesQ.loading ? '…' : fmtInt(withData.length)}</dd>
          </div>
          <div>
            <dt>Dataset storage</dt>
            <dd>
              {healthQ.data ? `${healthQ.data.storage} · ${fmtInt(healthQ.data.uploads)} uploads` : healthQ.error ? 'unreachable' : '…'}
            </dd>
          </div>
          <div>
            <dt>Analytics-ready stores</dt>
            <dd>{compareQ.loading ? '…' : fmtInt((compareQ.data?.stores || []).length)}</dd>
          </div>
          <div>
            <dt>Local profile</dt>
            <dd>{profile ? `${profile.name} (${profile.role})` : 'not set'}</dd>
          </div>
        </dl>
        <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Link to="/history" className="btn btn-secondary btn-sm">
            <Database size={14} aria-hidden="true" /> Data health
          </Link>
          <Link to="/settings" className="btn btn-ghost btn-sm">
            <ShieldCheck size={14} aria-hidden="true" /> Backend status
          </Link>
        </div>
      </div>
    </div>
  )
}
