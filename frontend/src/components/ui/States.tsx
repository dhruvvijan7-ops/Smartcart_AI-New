import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw, ServerOff } from 'lucide-react'
import Button from './Button'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="row" style={{ gap: 9, color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
      <RefreshCw size={15} className="spin" aria-hidden="true" />
      {label}
    </span>
  )
}

export function LoadingSkeleton({
  rows = 4,
  height = 16,
  width = '100%',
}: {
  rows?: number
  height?: number
  width?: string | number
}) {
  return (
    <div aria-hidden="true" aria-label="Loading" role="status" style={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height, width: i === rows - 1 ? '62%' : width, marginBottom: 10 }}
        />
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card-pad">
          <div className="skeleton skeleton-line" style={{ width: '45%' }} />
          <div className="skeleton" style={{ height: 30, width: '68%', marginTop: 12 }} />
          <div className="skeleton skeleton-line" style={{ width: '85%', marginTop: 14 }} />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading table" className="card card-pad">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="row" style={{ gap: 14, marginBottom: 12 }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="skeleton"
              style={{ height: 14, flex: c === 0 ? 2 : 1, opacity: 1 - r * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`state-box ${compact ? 'compact' : ''}`}>
      <div className="state-icon" aria-hidden="true">
        {icon ?? <Inbox size={20} />}
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Unable to load this data',
  description,
  onRetry,
  compact,
  action,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  compact?: boolean
  action?: ReactNode
}) {
  return (
    <div className={`state-box error ${compact ? 'compact' : ''}`} role="alert">
      <div className="state-icon" aria-hidden="true">
        <AlertTriangle size={20} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      <div className="row" style={{ gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {action}
        {onRetry ? (
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function DegradedBanner({
  title,
  children,
  onRetry,
  tone = 'warning',
  action,
}: {
  title: string
  children?: ReactNode
  onRetry?: () => void
  tone?: 'warning' | 'info'
  action?: ReactNode
}) {
  return (
    <div className={`degraded-banner ${tone === 'info' ? 'info' : ''}`} role="status">
      <ServerOff size={17} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
      <div>
        <strong>{title}</strong>
        {children ? <div style={{ marginTop: 3 }}>{children}</div> : null}
      </div>
      {(onRetry || action) && (
        <div className="db-actions">
          {action}
          {onRetry ? (
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}
