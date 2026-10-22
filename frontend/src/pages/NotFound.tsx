import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'
import { useEffect } from 'react'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    document.title = 'Page not found · SmartCart AI'
  }, [])

  return (
    <div
      className="lp"
      style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}
    >
      <div style={{ width: 'min(560px, 100%)', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--lp-white)',
            border: '1px solid var(--lp-line)',
            borderRadius: 999,
            padding: '7px 16px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--lp-muted-blue)',
            marginBottom: 26,
          }}
        >
          <Compass size={15} aria-hidden="true" /> 404 · Route not found
        </div>

        <h1 className="display-xl" style={{ color: 'var(--lp-blue)', fontSize: 'clamp(2.4rem, 7vw, 3.6rem)' }}>
          This aisle is <span style={{ color: 'var(--lp-coral)', fontFamily: 'var(--font-editorial)', fontStyle: 'italic' }}>empty.</span>
        </h1>

        <p style={{ marginTop: 18, color: 'color-mix(in srgb, var(--lp-ink) 72%, var(--lp-ivory))', lineHeight: 1.7 }}>
          No application route matches <code style={{ background: 'var(--lp-white)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--lp-line)' }}>{location.pathname}</code>.
          The page may have moved, or the address may be mistyped.
        </p>

        <div className="row" style={{ justifyContent: 'center', gap: 14, marginTop: 30 }}>
          <Link to="/" className="btn btn-lp-primary btn-lg">
            <Home size={16} aria-hidden="true" /> Back to home
          </Link>
          <Link to="/dashboard" className="btn btn-lp-secondary btn-lg">
            <ArrowLeft size={16} aria-hidden="true" /> Open the dashboard
          </Link>
        </div>

        <div className="row" style={{ justifyContent: 'center', gap: 18, marginTop: 26, fontSize: '0.84rem', flexWrap: 'wrap' }}>
          <Link to="/stores" style={{ color: 'var(--lp-blue)', fontWeight: 600 }}>Stores</Link>
          <Link to="/compare" style={{ color: 'var(--lp-blue)', fontWeight: 600 }}>Compare</Link>
          <Link to="/upload" style={{ color: 'var(--lp-blue)', fontWeight: 600 }}>Upload dataset</Link>
          <Link to="/history" style={{ color: 'var(--lp-blue)', fontWeight: 600 }}>Data health</Link>
          <Link to="/login" style={{ color: 'var(--lp-blue)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
