import type { ReactNode } from 'react'
import { Check, CircleHelp, X } from 'lucide-react'
import type { Capability } from '../../lib/types'

export function StatCard({
  label,
  value,
  note,
  icon,
  tone = 'brand',
  hint,
}: {
  label: string
  value: ReactNode
  note?: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'coral' | 'ok' | 'warn' | 'bad'
  hint?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon ? (
          <span className={`stat-icon ${tone === 'brand' ? '' : tone}`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="stat-value">{value}</div>
      {note ? <div className="stat-note">{note}</div> : null}
      {hint ? (
        <div className="text-faint" style={{ fontSize: '0.74rem' }}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

export type BadgeTone = 'critical' | 'high' | 'warning' | 'good' | 'success' | 'info' | 'neutral'

export function StatusBadge({
  children,
  tone = 'neutral',
  dot = true,
  title,
}: {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  title?: string
}) {
  return (
    <span className={`badge badge-${tone} ${dot ? '' : 'badge-plain'}`} title={title}>
      {children}
    </span>
  )
}

export function toneFromRisk(tier: string | null | undefined): BadgeTone {
  const t = (tier || '').toLowerCase()
  if (t.includes('critical')) return 'critical'
  if (t.includes('high')) return 'high'
  if (t.includes('warning') || t.includes('watch')) return 'warning'
  if (t.includes('good') || t.includes('stable') || t.includes('ok')) return 'good'
  return 'neutral'
}

const CAPABILITY_LABELS: { key: keyof Capability; label: string }[] = [
  { key: 'has_upload', label: 'Dataset upload' },
  { key: 'has_product_name', label: 'Product names' },
  { key: 'has_category', label: 'Categories' },
  { key: 'has_stock', label: 'Stock levels' },
  { key: 'has_reorder', label: 'Reorder levels' },
  { key: 'has_price', label: 'Unit price' },
  { key: 'has_cost', label: 'Unit cost' },
  { key: 'has_sales', label: 'Sales velocity' },
  { key: 'has_expiry', label: 'Expiry dates' },
  { key: 'has_dates', label: 'Date columns' },
  { key: 'has_manual', label: 'Manual items' },
  { key: 'has_lead_time', label: 'Lead time' },
]

export function CapabilityChip({ capability, supported }: { capability: keyof Capability; supported: boolean }) {
  const label = CAPABILITY_LABELS.find((c) => c.key === capability)?.label ?? capability
  return (
    <span className={`chip ${supported ? 'chip-on' : 'chip-off'}`} title={supported ? `${label} available` : `${label} not present in this dataset`}>
      {supported ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
      {label}
    </span>
  )
}

export function CapabilityRow({ capabilities }: { capabilities: Capability | undefined | null }) {
  if (!capabilities) return null
  return (
    <div className="capability-row">
      {CAPABILITY_LABELS.filter((c) => capabilities[c.key]).map((c) => (
        <CapabilityChip key={c.key} capability={c.key} supported />
      ))}
    </div>
  )
}

export function CapabilitySummary({ capabilities }: { capabilities: Capability | undefined | null }) {
  if (!capabilities) return null
  const supported = CAPABILITY_LABELS.filter((c) => capabilities[c.key])
  const missing = CAPABILITY_LABELS.filter((c) => !capabilities[c.key])
  return (
    <div>
      <div className="capability-row">
        {supported.map((c) => (
          <CapabilityChip key={c.key} capability={c.key} supported />
        ))}
      </div>
      {missing.length ? (
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <span className="text-faint" style={{ fontSize: '0.76rem', display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <CircleHelp size={12} aria-hidden="true" /> Not in dataset:
          </span>
          <span className="text-faint" style={{ fontSize: '0.76rem' }}>
            {missing.map((m) => m.label).join(', ')}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export { CAPABILITY_LABELS }
