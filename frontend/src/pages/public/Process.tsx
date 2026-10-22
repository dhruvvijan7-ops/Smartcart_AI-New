import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FileSpreadsheet, ListChecks, LineChart, ScanSearch, ShoppingBasket } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    t: 'Import inventory data',
    d: 'Upload a CSV or XLSX export from any store. The parser inspects headers and estimates row counts before anything is written.',
  },
  {
    n: '02',
    t: 'Map and validate columns',
    d: 'Confirm which header is the product name, and map optional columns such as stock, expiry and price. Validation issues are listed before you commit.',
  },
  {
    n: '03',
    t: 'Analyse store-level information',
    d: 'Once a store has an active upload, expiry bands, sales rankings and category mix become available for that store.',
  },
  {
    n: '04',
    t: 'Review actionable insights',
    d: 'Open the store detail tabs to see the most-expiring rows, the weakest sellers and the data-quality issues behind them.',
  },
  {
    n: '05',
    t: 'Use evidence-based reorder recommendations',
    d: 'Generate an order list where every line shows its formula, quantity and estimated cost — and export it as CSV.',
  },
]

const expiryData = [
  { band: 'Critical', rows: 121 },
  { band: 'High', rows: 34 },
  { band: 'Watch', rows: 58 },
  { band: 'Stable', rows: 96 },
]
const expiryColors = ['#c34242', '#ef8557', '#b7791f', '#237a57']

const mixData = [
  { name: 'Fruits & Veg', value: 34 },
  { name: 'Grains', value: 22 },
  { name: 'Dairy', value: 16 },
  { name: 'Seafood', value: 12 },
  { name: 'Other', value: 16 },
]
const mixColors = ['#226192', '#4a8fbd', '#7894a8', '#ef8557', '#d5cfc4']

const stockData = [
  { item: 'Rice', stock: 78, reorder: 94 },
  { item: 'Oil', stock: 41, reorder: 36 },
  { item: 'Dal', stock: 22, reorder: 55 },
  { item: 'Tea', stock: 64, reorder: 40 },
  { item: 'Flour', stock: 19, reorder: 48 },
]

export default function Process() {
  return (
    <>
      <section className="lp-section blue" id="how-it-works" aria-labelledby="how-title">
        <div className="lp-container">
          <div className="lp-section-head reveal">
            <div className="eyebrow">How it works</div>
            <h2 id="how-title">
              Five steps from a spreadsheet to a <span className="serif">decision</span>
            </h2>
            <p>
              The workflow mirrors the API: import, map, analyse, review, act. Each step is explicit so you always
              know what the platform did with your file.
            </p>
          </div>

          <div className="lp-timeline">
            {STEPS.map((s, i) => (
              <div className="lp-step reveal" data-delay={String(Math.min(i, 5))} key={s.n}>
                <span className="n">{s.n}</span>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>

          <div className="row reveal" style={{ gap: 12, marginTop: 34 }}>
            {[
              { icon: <FileSpreadsheet size={15} />, l: 'CSV & XLSX accepted' },
              { icon: <ListChecks size={15} />, l: 'Validation before commit' },
              { icon: <ScanSearch size={15} />, l: 'Row-level issue codes' },
              { icon: <ShoppingBasket size={15} />, l: 'Manual items supported' },
            ].map((f) => (
              <span key={f.l} className="chip" style={{ background: 'rgba(234,230,222,0.12)', borderColor: 'rgba(234,230,222,0.28)', color: 'var(--lp-ivory)' }}>
                <span style={{ color: 'var(--lp-coral)', display: 'flex' }} aria-hidden="true">
                  {f.icon}
                </span>
                {f.l}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="analytics" aria-labelledby="analytics-title">
        <div className="lp-container">
          <div className="lp-section-head reveal">
            <div className="eyebrow">Analytics preview</div>
            <h2 id="analytics-title">
              The kinds of analysis waiting <span className="serif">inside</span> the product
            </h2>
            <p>
              These charts are rendered with the same charting library the application uses. The values shown here
              are illustrative samples used to demonstrate layout — they are not live readings from your stores.
            </p>
          </div>

          <div
            className="reveal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--lp-white)',
              border: '1px dashed var(--lp-line)',
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--lp-muted-blue)',
              marginBottom: 18,
            }}
          >
            <LineChart size={14} aria-hidden="true" /> Illustrative sample data — label applies to all three panels
          </div>

          <div className="grid grid-3">
            <div className="lp-mock reveal">
              <div className="lp-mock-head">
                <span className="dots" aria-hidden="true">
                  <i /> <i /> <i />
                </span>
                <span className="mt">Expiry distribution</span>
              </div>
              <div className="lp-mock-body" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expiryData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4dfd5" vertical={false} />
                    <XAxis dataKey="band" tick={{ fontSize: 11, fill: '#617184' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#617184' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                    <Bar dataKey="rows" radius={[6, 6, 0, 0]}>
                      {expiryData.map((d) => (
                        <Cell key={d.band} fill={expiryColors[expiryData.indexOf(d)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-note" style={{ padding: '0 16px 14px' }}>
                Bands are computed relative to the upload anchor date.
              </div>
            </div>

            <div className="lp-mock reveal" data-delay="1">
              <div className="lp-mock-head">
                <span className="dots" aria-hidden="true">
                  <i /> <i /> <i />
                </span>
                <span className="mt">Category mix</span>
              </div>
              <div className="lp-mock-body" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mixData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                      {mixData.map((d) => (
                        <Cell key={d.name} fill={mixColors[mixData.indexOf(d)]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-note" style={{ padding: '0 16px 14px' }}>
                Share of units sold per category.
              </div>
            </div>

            <div className="lp-mock reveal" data-delay="2">
              <div className="lp-mock-head">
                <span className="dots" aria-hidden="true">
                  <i /> <i /> <i />
                </span>
                <span className="mt">Stock vs reorder level</span>
              </div>
              <div className="lp-mock-body" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4dfd5" vertical={false} />
                    <XAxis dataKey="item" tick={{ fontSize: 11, fill: '#617184' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#617184' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(34,97,146,0.06)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="stock" name="In stock" fill="#226192" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="reorder" name="Reorder level" fill="#ef8557" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-note" style={{ padding: '0 16px 14px' }}>
                Items below their reorder level are flagged for ordering.
              </div>
            </div>
          </div>

          <div className="grid grid-2 mt-3">
            <div className="lp-problem-card reveal">
              <h3 style={{ color: 'var(--lp-blue)', fontSize: '1.1rem' }}>Dataset quality indicators</h3>
              <div className="pp-list">
                {[
                  ['Rows with issues', 'Counted per issue code: missing category, invalid numbers, impossible dates'],
                  ['Duplicate product names', 'Flagged so double-counted rows do not inflate rankings'],
                  ['Price outliers', 'Values far above the median are highlighted for review'],
                  ['Rows discarded by filter', 'Shown explicitly after a store-filtered import'],
                ].map(([k, v]) => (
                  <div className="pp-item" key={k}>
                    <span className="pi" aria-hidden="true">
                      <ScanSearch size={15} />
                    </span>
                    <span>
                      <strong>{k}</strong>
                      <span>{v}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lp-problem-card reveal" data-delay="1">
              <h3 style={{ color: 'var(--lp-blue)', fontSize: '1.1rem' }}>Cross-store metrics</h3>
              <div className="pp-list">
                {[
                  ['Item and record counts', 'Per store, with the active upload that produced them'],
                  ['Units and reorder load', 'Totals side by side, with estimated cost where prices exist'],
                  ['Common items', 'Products that appear in more than one store dataset'],
                  ['Consolidated orders', 'One combined reorder list, attributed per store'],
                ].map(([k, v]) => (
                  <div className="pp-item" key={k}>
                    <span className="pi" aria-hidden="true">
                      <ShoppingBasket size={15} />
                    </span>
                    <span>
                      <strong>{k}</strong>
                      <span>{v}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
