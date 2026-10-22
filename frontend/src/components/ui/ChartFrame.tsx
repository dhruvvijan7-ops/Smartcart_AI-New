import type { ReactNode } from 'react'

export default function ChartFrame({
  title,
  subtitle,
  actions,
  children,
  legend,
  note,
  height,
  ariaLabel,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  legend?: { label: string; color: string }[]
  note?: ReactNode
  height?: number
  ariaLabel?: string
}) {
  return (
    <section className="chart-frame" aria-label={ariaLabel || title}>
      <div className="chart-head">
        <div className="min-w-0">
          <h3 className="chart-title">{title}</h3>
          {subtitle ? <div className="chart-sub">{subtitle}</div> : null}
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      <div className="chart-body" style={height ? { height } : undefined}>
        {children}
      </div>
      {legend?.length ? (
        <div className="chart-legend">
          {legend.map((l) => (
            <span className="lg" key={l.label}>
              <span className="sw" style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </span>
          ))}
        </div>
      ) : null}
      {note ? <div className="chart-note">{note}</div> : null}
    </section>
  )
}
