import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, ShoppingBasket, TriangleAlert } from 'lucide-react'
import Button from '../../components/ui/Button'
import { apiErrorMessage } from '../../lib/api'
import api from '../../lib/api'

export default function ForgotPassword() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [detail, setDetail] = useState<string>('')

  const checkApi = async () => {
    setStatus('checking')
    setDetail('')
    try {
      const res = await api.get('/health', { baseURL: '' })
      setStatus('ok')
      setDetail(`API responded at ${new Date(String(res.data?.timestamp || '')).toLocaleString() || 'just now'} — reachable, but it exposes no password-reset endpoint.`)
    } catch (err) {
      setStatus('error')
      setDetail(apiErrorMessage(err, 'The API could not be reached.'))
    }
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

            <div
              className="row"
              style={{ gap: 10, marginBottom: 16, color: 'var(--warning)', fontWeight: 700, fontSize: '0.84rem' }}
            >
              <TriangleAlert size={17} aria-hidden="true" /> Account recovery is not available in this deployment
            </div>

            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Forgot password</h1>

            <p style={{ color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.7 }}>
              Password recovery requires a server-side account system with password-reset tokens or email
              delivery. <strong>The SmartCart API in this repository has no such endpoints</strong> — there is no
              registration, login, session or reset route anywhere in the backend. SmartCart AI will not simulate
              a reset email that cannot be sent.
            </p>

            <div className="tint-panel" style={{ marginTop: 22 }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>What you can do instead</strong>
              <ul style={{ margin: '10px 0 0 18px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                <li>Continue into the workspace without a profile — every API route is open.</li>
                <li>
                  Use the local display profile on the <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>sign-in screen</Link>{' '}
                  if you only want your name in the header.
                </li>
                <li>If you operate this deployment, add an authentication layer in front of the API.</li>
              </ul>
            </div>

            <div className="row" style={{ gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-secondary">
                <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
              </Link>
              <Button variant="ghost" onClick={() => void checkApi()} loading={status === 'checking'}>
                Check API status
              </Button>
              <Link to="/dashboard" className="btn btn-ghost">
                Open the app
              </Link>
            </div>

            {status !== 'idle' && status !== 'checking' ? (
              <div
                className={`degraded-banner ${status === 'ok' ? 'info' : ''}`}
                style={{ marginTop: 18 }}
                role="status"
              >
                {status === 'ok' ? (
                  <CircleCheck size={17} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
                ) : (
                  <TriangleAlert size={17} aria-hidden="true" style={{ marginTop: 2, flex: 'none' }} />
                )}
                <div>
                  <strong>{status === 'ok' ? 'API reachable' : 'API unreachable'}</strong>
                  <div style={{ marginTop: 3 }}>{detail}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="auth-art-side" aria-hidden="true">
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2>Honest limits beat fake flows.</h2>
            <p>
              Rather than showing a “check your inbox” screen that would always lie, this page states exactly what
              the backend supports.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
