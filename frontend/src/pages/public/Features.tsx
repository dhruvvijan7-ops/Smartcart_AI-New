import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  ChartColumn,
  CircleAlert,
  ReceiptText,
} from 'lucide-react'

function MockWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lp-mock reveal">
      <div className="lp-mock-head">
        <span className="dots" aria-hidden="true">
          <i /> <i /> <i />
        </span>
        <span className="mt">{title}</span>
      </div>
      <div className="lp-mock-body">{children}</div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed #e4dfd5' }}>
      {children}
    </div>
  )
}

function Tag({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: '0.68rem',
        fontWeight: 800,
        color,
        background: `${color}14`,
        border: `1px solid ${color}44`,
        borderRadius: 999,
        padding: '3px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function Feature({
  eyebrow,
  title,
  body,
  bullets,
  link,
  linkLabel,
  reverse,
  visual,
}: {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  link: string
  linkLabel: string
  reverse?: boolean
  visual: ReactNode
}) {
  return (
    <article className={`lp-feature ${reverse ? 'reverse' : ''}`}>
      <div className="lp-feature-copy reveal">
        <div className="eyebrow">{eyebrow}</div>
        <h3>{title}</h3>
        <p>{body}</p>
        <ul>
          {bullets.map((b) => (
            <li key={b}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
        <Link to={link} className="lp-feature-link">
          {linkLabel} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <div className="lp-feature-visual">{visual}</div>
    </article>
  )
}

export default function Features() {
  return (
    <section className="lp-section" id="features" aria-labelledby="features-title">
      <div className="lp-container">
        <div className="lp-section-head reveal">
          <div className="eyebrow">Feature showcase</div>
          <h2 id="features-title">
            Eight workflows, one <span className="serif">coherent</span> product
          </h2>
          <p>
            Every capability below maps to an endpoint in the SmartCart API. Nothing here is decorative: each
            preview mirrors a screen you can open in the application.
          </p>
        </div>

        <Feature
          eyebrow="01 — Multi-store"
          title="Manage every store from one workspace"
          body="Create a store, attach a dataset, and keep each location's inventory separate but comparable. Store cards summarise upload status, record counts and the capabilities each dataset actually supports."
          bullets={[
            'Store profile with lead time and safety days',
            'Active upload tracked per store',
            'Empty-store and re-upload workflows',
          ]}
          link="/stores"
          linkLabel="Open stores"
          visual={
            <MockWindow title="Stores">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
                {[
                  { n: 'Grocery Main', c: 'Bengaluru', u: 990, s: 'ready' },
                  { n: 'City Mart', c: 'Mumbai', u: 405, s: 'ready' },
                  { n: 'Excel Depot', c: 'Delhi', u: 80, s: 'partial' },
                  { n: 'New store', c: 'No dataset yet', u: 0, s: 'empty' },
                ].map((st) => (
                  <div key={st.n} style={{ border: '1px solid #e4dfd5', borderRadius: 12, padding: 12, background: '#fbfaf7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.86rem', color: '#172b3a' }}>{st.n}</strong>
                      <Tag color={st.s === 'ready' ? '#237a57' : st.s === 'partial' ? '#b7791f' : '#7894a8'}>
                        {st.s === 'ready' ? 'Upload active' : st.s === 'partial' ? 'Limited columns' : 'No dataset'}
                      </Tag>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#7894a8', marginTop: 3 }}>{st.c}</div>
                    <div style={{ fontSize: '0.78rem', color: '#226192', fontWeight: 700, marginTop: 8 }}>
                      {st.u ? `${st.u} records` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </MockWindow>
          }
        />

        <Feature
          eyebrow="02 — Import"
          title="Upload CSV or XLSX and map columns once"
          reverse
          visual={
            <MockWindow title="Column mapping">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <tbody>
                  {[
                    ['Product name', 'Item Name', 'required'],
                    ['Category', 'Product Category', 'optional'],
                    ['Stock', 'Qty Available', 'optional'],
                    ['Reorder level', 'Reorder Point', 'optional'],
                    ['Expiry date', 'Best Before', 'optional'],
                  ].map(([sem, col, kind]) => (
                    <tr key={sem}>
                      <td style={{ padding: '8px 6px', borderBottom: '1px dashed #e4dfd5', fontWeight: 700, color: '#172b3a' }}>{sem}</td>
                      <td style={{ padding: '8px 6px', borderBottom: '1px dashed #e4dfd5', color: '#226192' }}>{col}</td>
                      <td style={{ padding: '8px 6px', borderBottom: '1px dashed #e4dfd5', textAlign: 'right' }}>
                        <Tag color={kind === 'required' ? '#ef8557' : '#7894a8'}>{kind}</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, fontSize: '0.76rem', color: '#617184', lineHeight: 1.5 }}>
                Only <strong>product name</strong> is required. Everything else degrades gracefully — capabilities
                are switched off rather than faked.
              </div>
            </MockWindow>
          }
          body="A guided wizard handles file validation, header inspection, automatic mapping suggestions, optional row filtering by store, and a final validation summary before anything is written."
          bullets={[
            '25 MB limit, 200k rows, 200 columns',
            'Automatic mapping from common header names',
            'Duplicate file detection by checksum',
            'Row-level issue codes surfaced before import',
          ]}
          link="/upload"
          linkLabel="Start an upload"
        />

        <Feature
          eyebrow="03 — Expiry"
          title="See expiry risk against a stated anchor date"
          body="Expiry bands are calculated against the upload anchor date, not an ambiguous “today”. The most-expiring table lists the rows that need attention first, with category, row counts and risk band."
          bullets={[
            'Critical / High / Watch / Stable bands',
            'Expired rows grouped by category',
            'Shelf-life distribution histogram',
            'Anchor date shown wherever it is used',
          ]}
          link="/stores"
          linkLabel="View expiry analysis"
          visual={
            <MockWindow title="Expiry bands">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { l: 'Critical', v: 121, w: '100%', c: '#c34242' },
                  { l: 'High', v: 34, w: '32%', c: '#ef8557' },
                  { l: 'Watch', v: 58, w: '52%', c: '#b7791f' },
                  { l: 'Stable', v: 96, w: '78%', c: '#237a57' },
                ].map((b) => (
                  <Row key={b.l}>
                    <span style={{ width: 62, fontSize: '0.76rem', fontWeight: 600, color: '#617184' }}>{b.l}</span>
                    <span style={{ flex: 1, height: 10, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
                      <span style={{ display: 'block', width: b.w, height: '100%', background: b.c }} />
                    </span>
                    <span style={{ width: 34, textAlign: 'right', fontWeight: 800, fontSize: '0.8rem', color: '#172b3a' }}>{b.v}</span>
                  </Row>
                ))}
                <div style={{ fontSize: '0.74rem', color: '#7894a8' }}>Anchor date · 24 Feb 2025 · illustrative</div>
              </div>
            </MockWindow>
          }
        />

        <Feature
          eyebrow="04 — Sales"
          title="Rank products by real movement, not intuition"
          reverse
          visual={
            <MockWindow title="Top sellers">
              {[
                { n: 'Bread Flour', u: 1002, s: 94 },
                { n: 'Basmati Rice', u: 845, s: 88 },
                { n: 'Sunflower Oil', u: 702, s: 81 },
                { n: 'Toor Dal', u: 655, s: 77 },
                { n: 'Tea Leaves', u: 512, s: 70 },
              ].map((p, i) => (
                <Row key={p.n}>
                  <span style={{ width: 20, fontWeight: 800, color: '#ef8557', fontFamily: 'Manrope, sans-serif' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: '#172b3a', fontSize: '0.84rem' }}>{p.n}</span>
                  <span style={{ fontSize: '0.78rem', color: '#617184' }}>{p.u} units</span>
                  <Tag color="#226192">{p.s}% sell-through</Tag>
                </Row>
              ))}
            </MockWindow>
          }
          body="Top sellers, bottom sellers, category mix, monthly volume series and sell-through — each computed from the rows you uploaded, with revenue and profit shown only when price and cost columns exist."
          bullets={[
            'Top and bottom quartile rankings',
            'Category contribution mix',
            'Monthly units series when dates exist',
            'Profit shown only when unit cost is mapped',
          ]}
          link="/stores"
          linkLabel="See sales analytics"
        />

        <Feature
          eyebrow="05 — Replenishment"
          title="Reorder recommendations with the maths on show"
          body="Every recommended line states where the number came from: reorder point, safety stock, current stock, average daily movement and the source of the formula. No black boxes, no invented forecasts."
          bullets={[
            'Formula source labelled per line',
            'Estimated cost using price or cost column',
            'Totals per category and per store',
            'CSV export of the full order list',
          ]}
          link="/stores"
          linkLabel="Review order lists"
          visual={
            <MockWindow title="Order recommendation">
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#172b3a', fontFamily: 'Manrope, sans-serif' }}>Carrot · Fruits &amp; Vegetables</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, margin: '12px 0' }}>
                {[
                  ['Reorder pt', '81'],
                  ['Safety', '3'],
                  ['In stock', '61'],
                  ['Order', '99'],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: '#f5f2ec', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7894a8', fontWeight: 700 }}>{k}</div>
                    <div style={{ fontWeight: 800, color: '#172b3a', fontFamily: 'Manrope, sans-serif' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#226192', background: '#eaf1f7', borderRadius: 10, padding: '8px 10px' }}>
                reorder point 81 + safety 3 − stock 61 → adjusted to pack size = <strong>99 units</strong> · est ₹148.50
              </div>
            </MockWindow>
          }
        />

        <Feature
          eyebrow="06 — Comparison"
          title="Compare stores on the items they share"
          reverse
          visual={
            <MockWindow title="Common items">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr>
                    {['Item', 'Grocery Main', 'City Mart', 'Best'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px', color: '#7894a8', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #e4dfd5' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Basmati Rice', '317', '286', 'Grocery Main'],
                    ['Sunflower Oil', '—', '204', 'City Mart'],
                    ['Toor Dal', '188', '175', 'Grocery Main'],
                  ].map((r) => (
                    <tr key={r[0]}>
                      {r.map((c, i) => (
                        <td
                          key={i}
                          style={{
                            padding: '7px 6px',
                            borderBottom: '1px dashed #e4dfd5',
                            color: i === 3 ? '#d96c3c' : '#172b3a',
                            fontWeight: i === 3 ? 700 : 500,
                          }}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </MockWindow>
          }
          body="Select stores and line up the metrics that matter: units on hand, sales, expiry exposure and reorder load. Where a store's dataset cannot support a metric, the cell says so instead of showing a zero."
          bullets={[
            'Side-by-side KPI cards per store',
            'Common-item table with per-store values',
            'Consolidated reorder list across stores',
            'Unavailable metrics labelled, never invented',
          ]}
          link="/compare"
          linkLabel="Compare stores"
        />

        <Feature
          eyebrow="07 — Data quality"
          title="Every upload keeps its receipts"
          body="Each upload is stored with its filename, checksum, mapping, filter, row counts and parsing issues. Data health shows the whole history, with per-upload profiles you can export or delete."
          bullets={[
            'Storage health indicator',
            'Per-upload validation profile',
            'Issue counts by code',
            'Export raw rows or delete with confirmation',
          ]}
          link="/history"
          linkLabel="Open data health"
          visual={
            <MockWindow title="Upload history">
              {[
                { f: 'grocery-inventory-feb.csv', r: 990, i: 4, s: 'ready' },
                { f: 'city-mart-stock.csv', r: 405, i: 12, s: 'ready' },
                { f: 'excel-depot-partial.csv', r: 80, i: 31, s: 'warnings' },
              ].map((u) => (
                <Row key={u.f}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="truncate" style={{ display: 'block', fontWeight: 600, color: '#172b3a', fontSize: '0.82rem' }}>{u.f}</span>
                    <span style={{ fontSize: '0.72rem', color: '#7894a8' }}>{u.r} rows · {u.i} issue codes</span>
                  </span>
                  <Tag color={u.s === 'ready' ? '#237a57' : '#b7791f'}>{u.s}</Tag>
                </Row>
              ))}
            </MockWindow>
          }
        />

        <Feature
          eyebrow="08 — Signals"
          title="Operational signals derived from your data"
          reverse
          visual={
            <MockWindow title="Signals">
              {[
                { t: 'Expiry concentration', d: '121 of 121 items sit in the Critical band', c: '#c34242', icon: <CalendarClock size={14} /> },
                { t: 'Reorder load', d: '50 lines recommended · est ₹14,734', c: '#226192', icon: <ReceiptText size={14} /> },
                { t: 'Dataset issues', d: '31 rows carry validation codes', c: '#b7791f', icon: <CircleAlert size={14} /> },
                { t: 'Category drift', d: 'Fruits & Vegetables = 31% of expired rows', c: '#d96c3c', icon: <ChartColumn size={14} /> },
              ].map((s) => (
                <Row key={s.t}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: `${s.c}14`, color: s.c, display: 'grid', placeItems: 'center', flex: 'none' }} aria-hidden="true">
                    {s.icon}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: '#172b3a', fontSize: '0.84rem' }}>{s.t}</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: '#617184' }}>{s.d}</span>
                  </span>
                </Row>
              ))}
            </MockWindow>
          }
          body="Alerts in SmartCart AI are derived from data you can verify: expiry concentration, reorder load, dataset validation issues and category drift. Each signal links back to the rows that produced it."
          bullets={[
            'Derived from live store metrics',
            'Links to the underlying rows',
            'No predictive claims beyond the data',
          ]}
          link="/alerts"
          linkLabel="See alerts"
        />
      </div>
    </section>
  )
}
