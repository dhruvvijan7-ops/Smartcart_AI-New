import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Info, ShieldCheck, ShoppingBasket, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import { useProfile } from '../../context/ProfileContext'
import { useRevealAll } from '../../lib/hooks'

const ROLES = ['Store operator', 'Inventory manager', 'Category lead', 'Analyst', 'Other']

export default function Login() {
  useRevealAll([])
  const navigate = useNavigate()
  const { signIn } = useProfile()
  const [name, setName] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [showHint, setShowHint] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Enter a display name with at least 2 characters.')
      return
    }
    if (trimmed.length > 40) {
      setError('Display names are limited to 40 characters.')
      return
    }
    setError(null)
    setBusy(true)
    window.setTimeout(() => {
      signIn(trimmed, role)
      setBusy(false)
      toast.success(`Signed in locally as ${trimmed}`)
      navigate('/dashboard')
    }, 260)
  }

  return (
    <div className="lp">
      <div className="auth-wrap">
        <div className="auth-form-side">
          <div className="auth-form-inner">
            <Link to="/" className="lp-logo" style={{ marginBottom: 30 }}>
              <span className="mark" aria-hidden="true">
                <ShoppingBasket size={18} />
              </span>
              SmartCart AI
            </Link>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Sign in to your workspace</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6, fontSize: '0.93rem' }}>
              This deployment connects to the SmartCart API, which exposes no account, session or password
              endpoints. The form below creates a <strong>local display profile</strong> stored only in this
              browser.
            </p>

            <form onSubmit={submit} className="stack" style={{ gap: 16, marginTop: 26 }} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="display-name">
                  Display name <span className="req">*</span>
                </label>
                <input
                  id="display-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Rao"
                  autoComplete="name"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : 'login-note'}
                  maxLength={40}
                />
                {error ? (
                  <div className="field-error" id="login-error" role="alert">
                    {error}
                  </div>
                ) : null}
                <div className="field-hint" id="login-note">
                  Shown in the app header. Never sent to the server.
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="role">
                  Role
                </label>
                <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn-link row"
                style={{ gap: 6 }}
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
              >
                {showHint ? <EyeOff size={14} /> : <Eye size={14} />} Why is there no password?
              </button>

              {showHint ? (
                <div className="degraded-banner info" role="note">
                  <Info size={17} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
                  <div>
                    <strong>No server-side accounts exist in this build.</strong>
                    <div style={{ marginTop: 4 }}>
                      There is no registration, password or session endpoint in the API, so SmartCart AI does not
                      pretend to authenticate you. Every API route is currently open; this profile is cosmetic
                      personalisation only.
                    </div>
                  </div>
                </div>
              ) : null}

              <Button type="submit" size="lg" block loading={busy} icon={<ShieldCheck size={16} />}>
                Continue to the workspace
              </Button>

              <Link to="/dashboard" className="btn btn-secondary btn-lg btn-block">
                Skip — open the app without a profile
              </Link>

              <div className="row" style={{ justifyContent: 'center', gap: 14, fontSize: '0.84rem' }}>
                <Link to="/forgot-password" className="btn-link">
                  Account recovery
                </Link>
                <span className="text-faint">·</span>
                <Link to="/" className="btn-link">
                  Back to the website
                </Link>
              </div>
            </form>
          </div>
        </div>

        <aside className="auth-art-side" aria-hidden="true">
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2>Every number should come with its source.</h2>
            <p>
              SmartCart AI keeps store datasets separate, states the anchor date behind expiry bands, and prints
              the arithmetic on every reorder line.
            </p>
            <div className="auth-art-list">
              {[
                { icon: <Store size={16} />, t: 'Multi-store workspaces with independent datasets' },
                { icon: <ShoppingBasket size={16} />, t: 'Expiry, sales and reorder analytics per store' },
                { icon: <ShieldCheck size={16} />, t: 'Upload history, validation profiles and issue codes' },
              ].map((r) => (
                <div className="ai" key={r.t}>
                  {r.icon}
                  <span>{r.t}</span>
                </div>
              ))}
            </div>
            <Link to="/dashboard" className="btn btn-lp-primary" style={{ alignSelf: 'flex-start' }}>
              Explore without signing in <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
