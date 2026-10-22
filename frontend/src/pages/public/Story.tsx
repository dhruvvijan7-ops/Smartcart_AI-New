import { AlertTriangle, Check, GitCompareArrows, TableProperties } from 'lucide-react'

const PROBLEMS = [
  {
    problem: 'Inventory lives in scattered spreadsheets',
    detail: 'Every store keeps its own file, with its own column names and its own quirks.',
    solution: 'Import CSV or XLSX files, map columns once, and keep every store dataset versioned in one place.',
  },
  {
    problem: 'Expiry risk surfaces too late',
    detail: 'By the time a product is flagged, the stock is already unsellable.',
    solution: 'Expiry bands computed against the upload anchor date, with the most at-risk rows listed first.',
  },
  {
    problem: 'Stock levels are inconsistent across stores',
    detail: 'Nobody can say which store is over-stocked and which is about to run dry.',
    solution: 'Per-store item tables plus a cross-store comparison of common items, stock, sales and price.',
  },
  {
    problem: 'Winners and losers are hard to identify',
    detail: 'Category totals hide the products that quietly drain margin.',
    solution: 'Top and bottom sellers, category mix, monthly volume and sell-through — straight from your rows.',
  },
  {
    problem: 'Replenishment is calculated by hand',
    detail: 'Order quantities depend on who is on shift and how carefully they check stock.',
    solution: 'Reorder recommendations with the arithmetic shown: reorder point, safety stock, current stock, quantity.',
  },
  {
    problem: 'Bad rows poison every report',
    detail: 'Missing categories and impossible dates quietly distort totals.',
    solution: 'Per-row issue codes, upload profiles and a data-health view of every historical upload.',
  },
]

export default function Story() {
  return (
    <section className="lp-section alt" aria-labelledby="story-title">
      <div className="lp-container">
        <div className="lp-section-head reveal">
          <div className="eyebrow">The problem, and the response</div>
          <h2 id="story-title">
            Inventory problems are rarely mysterious. They are <span className="serif">unread</span>.
          </h2>
          <p>
            Most inventory failures are information failures: the data exists, but nobody can see it in time, in
            shape, or in context. SmartCart AI focuses on making that information readable and actionable.
          </p>
        </div>

        <div className="lp-problem-grid">
          <div className="lp-problem-card dark reveal">
            <div className="row" style={{ gap: 10 }}>
              <AlertTriangle size={18} style={{ color: 'var(--lp-coral)' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.15rem' }}>What operators run into</h3>
            </div>
            <div className="pp-list">
              {PROBLEMS.map((p) => (
                <div className="pp-item" key={p.problem}>
                  <span className="pi" aria-hidden="true">
                    <TableProperties size={15} />
                  </span>
                  <span>
                    <strong>{p.problem}</strong>
                    <span>{p.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-problem-card reveal" data-delay="1">
            <div className="row" style={{ gap: 10 }}>
              <Check size={18} style={{ color: 'var(--lp-coral-deep)' }} aria-hidden="true" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--lp-blue)' }}>What the platform does</h3>
            </div>
            <div className="pp-list">
              {PROBLEMS.map((p) => (
                <div className="pp-item" key={p.problem}>
                  <span className="pi" aria-hidden="true">
                    <GitCompareArrows size={15} />
                  </span>
                  <span>
                    <strong>{p.problem}</strong>
                    <span>{p.solution}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
