import { Link } from 'react-router-dom'
import { ArrowRight, Database, MapPin, Plus, Scale, Store as StoreIcon } from 'lucide-react'
import { storesApi } from '../../lib/api'
import { useApi } from '../../lib/hooks'
import type { StoreRecord } from '../../lib/types'
import { PageHeader } from '../../components/ui/PageHeader'
import { CardSkeleton, EmptyState, ErrorState } from '../../components/ui/States'
import { fmtDateTime, pluralize } from '../../lib/format'

export default function Stores() {
  const { data, error, loading, reload } = useApi<StoreRecord[]>(() => storesApi.getAll(), [], {
    validate: Array.isArray,
  })

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle="Each store keeps its own dataset, items and metrics. Analytics turn on once a store has an active upload."
        actions={
          <>
            <Link to="/compare" className="btn btn-secondary">
              <Scale size={16} aria-hidden="true" /> Compare stores
            </Link>
            <Link to="/stores/new" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" /> Add store
            </Link>
          </>
        }
      />

      {loading ? <CardSkeleton count={3} /> : null}

      {!loading && error ? (
        <ErrorState title="Stores could not be loaded" description={error} onRetry={reload} />
      ) : null}

      {!loading && !error && data && data.length === 0 ? (
        <EmptyState
          icon={<StoreIcon size={20} />}
          title="No stores yet"
          description="Add your first store, then attach a CSV or XLSX dataset to unlock expiry, sales and reorder analytics for it."
          action={
            <Link to="/stores/new" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" /> Add your first store
            </Link>
          }
        />
      ) : null}

      {!loading && !error && data && data.length > 0 ? (
        <>
          <div className="grid grid-3">
            {data.map((s) => (
              <Link to={`/stores/${s.id}`} className="card card-pad store-card" key={s.id}>
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <span className="store-avatar" aria-hidden="true">
                    <StoreIcon size={18} />
                  </span>
                  {s.active_upload_id ? (
                    <span className="badge badge-success">
                      <Database size={11} aria-hidden="true" /> Dataset #{s.active_upload_id}
                    </span>
                  ) : (
                    <span className="badge badge-warning">No dataset</span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.05rem', marginTop: 14 }}>{s.name}</h3>
                <div className="text-secondary" style={{ fontSize: '0.83rem', marginTop: 4 }}>
                  {s.city ? (
                    <span className="row" style={{ gap: 5 }}>
                      <MapPin size={13} aria-hidden="true" /> {s.city}
                    </span>
                  ) : (
                    <span className="row" style={{ gap: 5, color: 'var(--text-faint, #617184)' }}>
                      <MapPin size={13} aria-hidden="true" /> Location not set
                    </span>
                  )}
                </div>
                <div className="store-meta">
                  <span>Lead time {s.lead_time_days} d</span>
                  <span aria-hidden="true">·</span>
                  <span>Safety {s.safety_days} d</span>
                </div>
                <div className="row-between" style={{ marginTop: 16 }}>
                  <span className="text-faint" style={{ fontSize: '0.75rem' }}>
                    Added {fmtDateTime(s.created_at)}
                  </span>
                  <span className="row store-open" style={{ gap: 5, fontSize: '0.82rem', fontWeight: 700 }}>
                    Open <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="row" style={{ gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
            <span className="text-faint" style={{ fontSize: '0.84rem' }}>
              {data.length} {pluralize(data.length, 'store')}
              {data.filter((s) => s.active_upload_id).length} with an active dataset
            </span>
            <div style={{ flex: 1 }} />
            <Link to="/upload" className="btn btn-accent">
              <Database size={16} aria-hidden="true" /> Upload a dataset
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
