import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.label + i} className="row" style={{ gap: 7 }}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
          {i < items.length - 1 ? <ChevronRight size={12} aria-hidden="true" /> : null}
        </span>
      ))}
    </nav>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  children,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  breadcrumb?: { label: string; to?: string }[]
  children?: ReactNode
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="page-header" style={{ marginBottom: children ? 18 : 0 }}>
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  actions,
  id,
}: {
  title: string
  description?: string
  actions?: ReactNode
  id?: string
}) {
  return (
    <div className="section-heading row-between" style={{ alignItems: 'flex-end' }}>
      <div className="min-w-0">
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  )
}
