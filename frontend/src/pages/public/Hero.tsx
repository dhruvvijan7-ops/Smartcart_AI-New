import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, CalendarClock, ChartSpline, Layers, ReceiptText, ScanSearch } from 'lucide-react'

function ExpiryBars() {
  const bands = [
    { label: 'Critical', value: 121, pct: 100, color: '#c34242' },
    { label: 'High', value: 0, pct: 0, color: '#ef8557' },
    { label: 'Watch', value: 0, pct: 0, color: '#b7791f' },
    { label: 'Stable', value: 0, pct: 0, color: '#237a57' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {bands.map((b) => (
        <div key={b.label} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 40px', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#617184' }}>{b.label}</span>
          <span style={{ height: 9, background: '#eef2f7', borderRadius: 999, overflow: 'hidden', display: 'block' }}>
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${Math.max(b.pct, b.value ? 4 : 0)}%`,
                background: b.color,
                borderRadius: 999,
              }}
            />
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#172b3a', textAlign: 'right' }}>{b.value}</span>
        </div>
      ))}
    </div>
  )
}

function HeroPanel() {
  return (
    <div className="lp-panel">
      <div className="lp-panel-head">
        <div className="row" style={{ gap: 8 }}>
          <span className="dot" style={{ background: '#237a57' }} aria-hidden="true" />
          <span className="t">Store · Grocery Main</span>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#226192',
            background: '#eaf1f7',
            padding: '3px 8px',
            borderRadius: 999,
          }}
        >
          Dataset linked
        </span>
      </div>
      <div className="lp-panel-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { k: 'Items', v: '121' },
            { k: 'Past expiry', v: '985' },
            { k: 'To order', v: '50' },
          ].map((s) => (
            <div key={s.k} style={{ background: '#f5f2ec', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.64rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7894a8', fontWeight: 700 }}>
                {s.k}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#172b3a' }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7894a8', marginBottom: 10 }}>
          Expiry bands (vs upload anchor date)
        </div>
        <ExpiryBars />

        <div style={{ height: 1, background: '#d5cfc4', margin: '16px 0 12px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 'Bread Flour', c: 'Grains & Pulses', t: 'Critical', col: '#c34242', q: '19 rows' },
            { n: 'Carrot', c: 'Fruits & Vegetables', t: 'Reorder 99', col: '#226192', q: 'est ₹148' },
            { n: 'Milk', c: 'Dairy', t: 'Watch', col: '#b7791f', q: '14 rows' },
          ].map((r) => (
            <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#eae6de', flex: 'none' }} aria-hidden="true" />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', color: '#172b3a' }}>{r.n}</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#7894a8' }}>{r.c}</span>
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: r.col,
                  border: `1px solid ${r.col}44`,
                  background: `${r.col}14`,
                  padding: '3px 8px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {r.t}
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#617184', whiteSpace: 'nowrap' }}>{r.q}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 14,
            background: '#eaf1f7',
            border: '1px solid #cddfea',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: '0.74rem',
            color: '#226192',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ fontFamily: 'Manrope, sans-serif' }}>Reorder maths, shown:</strong> reorder point 81 + safety 3 −
          stock 61 = <strong>23</strong>, rounded to the supplier pack size → <strong>99 units</strong>.
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <>
      <section className="lp-hero" id="product">
        <div className="lp-container lp-hero-grid">
          <div>
            <div className="eyebrow eyebrow-coral reveal">Inventory intelligence platform</div>
            <h1 className="display-xl reveal" data-delay="1">
              Know your inventory. <span className="accent">Before it becomes a problem.</span>
            </h1>
            <p className="lede reveal" data-delay="2">
              Bring your inventory data together, uncover expiry risks, understand product performance, and make
              smarter replenishment decisions with SmartCart AI.
            </p>
            <div className="lp-hero-actions reveal" data-delay="3">
              <Link to="/dashboard" className="btn btn-lp-primary btn-lg">
                Explore the platform <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-lp-secondary btn-lg">
                Sign in
              </Link>
            </div>
            <div className="lp-hero-meta reveal" data-delay="4">
              <div className="m">
                <b>CSV &amp; XLSX</b>
                <span>Import with column mapping</span>
              </div>
              <div className="m">
                <b>Multi-store</b>
                <span>Side-by-side comparison</span>
              </div>
              <div className="m">
                <b>Transparent</b>
                <span>Every number has a source</span>
              </div>
            </div>
          </div>

          <div className="lp-visual reveal" data-delay="2">
            <svg
              aria-hidden="true"
              viewBox="0 0 520 480"
              style={{ position: 'absolute', inset: '-6% -8%', width: '116%', height: '112%', zIndex: 0 }}
            >
              <circle cx="82" cy="86" r="54" fill="#EF8557" opacity="0.22" />
              <rect x="392" y="34" width="96" height="96" rx="20" fill="none" stroke="#226192" strokeWidth="2" opacity="0.35" />
              <path d="M20 380 H500" stroke="#226192" strokeWidth="1" opacity="0.18" />
              <path d="M20 412 H500" stroke="#226192" strokeWidth="1" opacity="0.1" />
              <circle cx="470" cy="404" r="30" fill="#226192" opacity="0.12" />
              <path d="M330 460 l40 -40 l40 40 z" fill="#EF8557" opacity="0.35" />
            </svg>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <HeroPanel />

              <div className="lp-float-card" style={{ left: '-4%', top: '16%', animationDelay: '0.4s' }}>
                <span className="fc-icon" style={{ background: '#fdeee6', color: '#d96c3c' }} aria-hidden="true">
                  <CalendarClock size={17} />
                </span>
                <span>
                  <span className="fc-k">Expiry watch</span>
                  <span className="fc-v">Anchor-dated bands</span>
                </span>
              </div>

              <div className="lp-float-card" style={{ right: '-3%', bottom: '12%', animationDelay: '1.6s' }}>
                <span className="fc-icon" style={{ background: '#eaf1f7', color: '#226192' }} aria-hidden="true">
                  <ReceiptText size={17} />
                </span>
                <span>
                  <span className="fc-k">Order batch</span>
                  <span className="fc-v">50 lines · est. ₹14,734</span>
                </span>
              </div>
            </div>
            <p
              className="reveal"
              data-delay="4"
              style={{
                position: 'relative',
                zIndex: 1,
                marginTop: 14,
                fontSize: '0.72rem',
                color: '#7894a8',
                textAlign: 'center',
              }}
            >
              Illustrative panel shaped like the real store detail screen. Values are examples, not live data.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-section tight" aria-label="What SmartCart AI covers">
        <div className="lp-container">
          <div className="lp-strip reveal">
            {[
              { icon: <Layers size={17} />, t: 'Inventory visibility', d: 'One view of stock per store' },
              { icon: <CalendarClock size={17} />, t: 'Expiry awareness', d: 'Bands anchored to your upload' },
              { icon: <ChartSpline size={17} />, t: 'Sales intelligence', d: 'Ranks, share and velocity' },
              { icon: <ReceiptText size={17} />, t: 'Replenishment planning', d: 'Arithmetic you can audit' },
              { icon: <Boxes size={17} />, t: 'Multi-store comparison', d: 'Common items, per store' },
              { icon: <ScanSearch size={17} />, t: 'Dataset quality', d: 'Issues surfaced, not hidden' },
            ].map((s) => (
              <div className="s" key={s.t}>
                <span className="si" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="st">{s.t}</span>
                <span className="sd">{s.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
