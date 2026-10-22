import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Database, Minus, Plus, ReceiptText, ShieldCheck, Store, Table2 } from 'lucide-react'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is SmartCart AI?',
    a: 'SmartCart AI is an inventory intelligence platform for multi-store retail. It imports inventory datasets, analyses expiry risk, ranks product sales performance, produces reorder recommendations with visible arithmetic, and compares stores side by side.',
  },
  {
    q: 'What data can I upload?',
    a: 'CSV and XLSX files up to 25 MB, with a maximum of 200,000 rows and 200 columns. Only a product name column is required. Optional columns include category, stock, reorder level, reorder quantity, unit price, unit cost, units sold, expiry date, received date, last order date and lead time. A filter column can also be mapped when one file contains several stores.',
  },
  {
    q: 'How does store comparison work?',
    a: 'Each store with an active upload is summarised into comparable metrics — item count, record count, units sold, expiry exposure and reorder load. The comparison screen lines those metrics up, lists items common to more than one store, and consolidates reorder recommendations across stores.',
  },
  {
    q: 'How are reorder recommendations calculated?',
    a: 'From your data, not from a black box. Each line shows the reorder point, safety stock, current stock, average daily movement and the recommended quantity, together with the formula source and the basis used for estimated cost (unit cost when available, otherwise unit price). Where the dataset itself provides a reorder quantity, that value is used and labelled as such.',
  },
  {
    q: 'What happens when required columns are missing?',
    a: 'The upload still succeeds as long as a product name column is present. Analytics that depend on missing columns are switched off and labelled unavailable rather than being filled with placeholder values. Capabilities are shown per store so you can see exactly what each dataset supports.',
  },
  {
    q: 'Can I manage multiple stores?',
    a: 'Yes. Stores are first-class objects: each has its own profile, active upload, item table and metrics. You can add an empty store and populate it manually, or attach a dataset during creation, and re-upload at any time to replace the active dataset.',
  },
  {
    q: 'How do I access the platform?',
    a: 'Open the application from the “Get started” button. Note that this deployment exposes no server-side account system — the sign-in screen stores a local display profile in your browser only, and it is never sent to the API.',
  },
]

const DIFFERENTIATORS = [
  {
    icon: <Table2 size={18} />,
    t: 'Clear inventory visibility',
    d: 'Per-store item tables with search, filtering, pagination and source labels distinguishing dataset rows from manual entries.',
  },
  {
    icon: <ReceiptText size={18} />,
    t: 'Transparent arithmetic',
    d: 'Every reorder line carries its formula, quantity, cost basis and estimated cost. Nothing is asserted without a source.',
  },
  {
    icon: <Database size={18} />,
    t: 'Capability-aware analytics',
    d: 'If a dataset has no expiry column, expiry analytics are reported as unavailable — never as an empty chart.',
  },
  {
    icon: <ShieldCheck size={18} />,
    t: 'Data quality visibility',
    d: 'Upload profiles expose issue counts, discarded rows, duplicates and parse errors for every historical import.',
  },
  {
    icon: <Store size={18} />,
    t: 'Store-level and cross-store workflows',
    d: 'Work inside one store, then step up to comparison and consolidated ordering when you need the network view.',
  },
]

function FaqItem({ item, open, onToggle }: { item: { q: string; a: string }; open: boolean; onToggle: () => void }) {
  return (
    <div className="faq-item">
      <h3 style={{ margin: 0 }}>
        <button className="faq-q" aria-expanded={open} onClick={onToggle} id={`faq-q-${item.q.slice(0, 12)}`} aria-controls={`faq-a-${item.q.slice(0, 12)}`}>
          {item.q}
          <span className="fq-icon" aria-hidden="true">
            {open ? <Minus size={14} /> : <Plus size={14} />}
          </span>
        </button>
      </h3>
      {open ? (
        <div className="faq-a" id={`faq-a-${item.q.slice(0, 12)}`} role="region" aria-labelledby={`faq-q-${item.q.slice(0, 12)}`}>
          {item.a}
        </div>
      ) : null}
    </div>
  )
}

export default function Closing() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <>
      <section className="lp-section" aria-labelledby="diff-title">
        <div className="lp-container">
          <div className="lp-section-head reveal">
            <div className="eyebrow">Why it feels different</div>
            <h2 id="diff-title">
              Built to make inventory information <span className="serif">legible</span>
            </h2>
            <p>
              The platform does not claim predictive accuracy or market leadership. It claims something narrower
              and more useful: that when you open a screen, you can tell where every number came from.
            </p>
          </div>

          <div className="grid grid-3">
            {DIFFERENTIATORS.map((d, i) => (
              <div className="lp-problem-card reveal" data-delay={String(Math.min(i, 4))} key={d.t}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'var(--lp-ivory)',
                    color: 'var(--lp-coral-deep)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  aria-hidden="true"
                >
                  {d.icon}
                </span>
                <h3 style={{ color: 'var(--lp-blue)', fontSize: '1.05rem' }}>{d.t}</h3>
                <p style={{ fontSize: '0.9rem', color: 'color-mix(in srgb, var(--lp-ink) 72%, var(--lp-ivory))', lineHeight: 1.6 }}>{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="faq" aria-labelledby="faq-title">
        <div className="lp-container lp-faq">
          <div className="reveal">
            <div className="eyebrow">Questions</div>
            <h2 id="faq-title" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', color: 'var(--lp-blue)', marginTop: 12, letterSpacing: '-0.025em' }}>
              Frequently asked
            </h2>
            <p style={{ marginTop: 14, color: 'color-mix(in srgb, var(--lp-ink) 74%, var(--lp-ivory))', lineHeight: 1.65 }}>
              Answers describe the platform as it is implemented today, including its limits. If a capability is
              not available in this deployment, it says so.
            </p>
            <Link to="/dashboard" className="btn btn-lp-secondary" style={{ marginTop: 22 }}>
              Open the application <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="reveal" data-delay="1">
            {FAQS.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="cta-title">
        <div className="lp-container">
          <div className="lp-cta reveal">
            <div>
              <div className="eyebrow" style={{ color: 'var(--lp-coral)' }}>Get started</div>
              <h2 id="cta-title">Put your inventory where you can read it.</h2>
              <p>
                Upload a store dataset, map a few columns, and see expiry risk, sales performance and reorder
                recommendations built from your own rows.
              </p>
            </div>
            <div className="lp-cta-actions">
              <Link to="/dashboard" className="btn btn-lp-primary btn-lg">
                Get started <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-lp-onblue btn-lg">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
