import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Database, HardDrive, Monitor, Moon, RotateCcw, ShieldCheck, Sun, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage, datasetApi } from '../lib/api'
import { useUITheme } from '../context/UIThemeContext'
import type { DensityName } from '../context/UIThemeContext'
import { useProfile } from '../context/ProfileContext'
import { PageHeader, SectionHeading } from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Metrics'
import { fmtDateTime } from '../lib/format'

interface RootHealth {
  status: string
  timestamp: string
}

interface DatasetHealth {
  storage: string
  uploads: number
}

export default function Settings() {
  const { theme, setTheme, density, setDensity, enableAnimations, setEnableAnimations, resetToDefaults } =
    useUITheme()
  const { profile } = useProfile()

  const [rootHealth, setRootHealth] = useState<RootHealth | null>(null)
  const [rootError, setRootError] = useState<string | null>(null)
  const [dsHealth, setDsHealth] = useState<DatasetHealth | null>(null)
  const [dsError, setDsError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  const checkBackend = useCallback(async () => {
    setChecking(true)
    setRootError(null)
    setDsError(null)
    try {
      const res = await api.get('/health', { baseURL: '' })
      setRootHealth(res.data as RootHealth)
    } catch (err) {
      setRootHealth(null)
      setRootError(apiErrorMessage(err, 'The API did not respond.'))
    }
    try {
      const res = await datasetApi.health()
      setDsHealth(res.data as DatasetHealth)
    } catch (err) {
      setDsHealth(null)
      setDsError(apiErrorMessage(err, 'Dataset storage status could not be read.'))
    } finally {
      setChecking(false)
      setCheckedAt(new Date().toISOString())
    }
  }, [])

  useEffect(() => {
    void checkBackend()
  }, [checkBackend])

  return (
    <div style={{ maxWidth: 980 }}>
      <PageHeader
        title="Settings"
        subtitle="Workspace appearance, local profile and live backend status. These preferences are stored in this browser only."
        actions={
          <Button
            variant="ghost"
            icon={<RotateCcw size={15} />}
            onClick={() => {
              resetToDefaults()
              toast.success('Appearance reset to defaults')
            }}
          >
            Reset appearance
          </Button>
        }
      />

      <div className="stack" style={{ gap: 18 }}>
        <div className="card card-pad">
          <SectionHeading title="Appearance" description="Theme, spacing density and motion — applied instantly." />
          <div className="grid grid-3" style={{ marginTop: 16 }}>
            <div>
              <div className="field-label">Theme</div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  <Sun size={14} aria-hidden="true" /> Light
                </button>
                <button
                  className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  <Moon size={14} aria-hidden="true" /> Dark
                </button>
              </div>
            </div>

            <div>
              <div className="field-label">
                <Monitor size={12} aria-hidden="true" style={{ verticalAlign: '-1px' }} /> Density
              </div>
              <div className="row" style={{ gap: 6 }}>
                {(['compact', 'comfortable', 'spacious'] as DensityName[]).map((d) => (
                  <button
                    key={d}
                    className={`btn ${density === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setDensity(d)}
                    aria-pressed={density === d}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label">Motion</div>
              <label className="row" style={{ gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableAnimations}
                  onChange={(e) => setEnableAnimations(e.target.checked)}
                />
                Enable micro-animations
              </label>
              <div className="text-faint" style={{ fontSize: '0.76rem', marginTop: 4 }}>
                Your system “reduce motion” preference is always respected.
              </div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <SectionHeading
            title="Local display profile"
            description="This deployment has no server-side accounts. The profile below never leaves your browser."
            actions={
              <Link to="/login" className="btn btn-secondary btn-sm">
                <UserRound size={14} aria-hidden="true" /> {profile ? 'Change profile' : 'Create profile'}
              </Link>
            }
          />
          <dl className="kv-list" style={{ marginTop: 14, maxWidth: 420 }}>
            <div>
              <dt>Name</dt>
              <dd>{profile?.name || 'Not set'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile?.role || '—'}</dd>
            </div>
            <div>
              <dt>Stored</dt>
              <dd>localStorage (this browser)</dd>
            </div>
          </dl>
          <div className="text-faint" style={{ fontSize: '0.78rem', marginTop: 12, lineHeight: 1.6 }}>
            The SmartCart API exposes no login, session or password endpoints, so SmartCart AI does not claim to
            authenticate you. All API routes are currently open.
          </div>
        </div>

        <div className="card card-pad">
          <SectionHeading
            title="Backend status"
            description="Live checks against the running API — no fabricated service list."
            actions={
              <Button variant="secondary" size="sm" loading={checking} onClick={() => void checkBackend()}>
                Re-check
              </Button>
            }
          />
          <div className="stack" style={{ gap: 10, marginTop: 14 }}>
            <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
              <span className="row" style={{ gap: 8 }}>
                <HardDrive size={15} aria-hidden="true" /> API server <code>/health</code>
              </span>
              <span className="row" style={{ gap: 10 }}>
                {rootHealth ? (
                  <StatusBadge tone={rootHealth.status === 'ok' ? 'success' : 'warning'}>
                    {rootHealth.status}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone={rootError ? 'critical' : 'neutral'}>{checking ? 'checking…' : 'no response'}</StatusBadge>
                )}
                {rootError ? <span className="text-faint" style={{ fontSize: '0.78rem' }}>{rootError}</span> : null}
              </span>
            </div>

            <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
              <span className="row" style={{ gap: 8 }}>
                <Database size={15} aria-hidden="true" /> Dataset storage <code>/api/dataset/health</code>
              </span>
              <span className="row" style={{ gap: 10 }}>
                {dsHealth ? (
                  <StatusBadge tone={dsHealth.storage === 'postgres' ? 'success' : 'critical'}>
                    {dsHealth.storage} · {dsHealth.uploads} uploads
                  </StatusBadge>
                ) : (
                  <StatusBadge tone={dsError ? 'critical' : 'neutral'}>{checking ? 'checking…' : 'no response'}</StatusBadge>
                )}
                {dsError ? <span className="text-faint" style={{ fontSize: '0.78rem' }}>{dsError}</span> : null}
              </span>
            </div>

            <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
              <span className="row" style={{ gap: 8 }}>
                <ShieldCheck size={15} aria-hidden="true" /> Account system
              </span>
              <StatusBadge tone="warning" title="Documented limitation of this backend">
                not available in API
              </StatusBadge>
            </div>
          </div>
          {checkedAt ? (
            <div className="text-faint" style={{ fontSize: '0.76rem', marginTop: 12 }}>
              Last checked {fmtDateTime(checkedAt)}
            </div>
          ) : null}
        </div>

        <div className="card card-pad">
          <SectionHeading title="Workspace facts" description="Fixed characteristics of this deployment." />
          <dl className="kv-list" style={{ marginTop: 14 }}>
            <div>
              <dt>Currency</dt>
              <dd>INR (₹) via Intl formatting</dd>
            </div>
            <div>
              <dt>Dataset limits</dt>
              <dd>25 MB · 200,000 rows · 200 columns</dd>
            </div>
            <div>
              <dt>Accepted formats</dt>
              <dd>CSV, XLSX (first sheet)</dd>
            </div>
            <div>
              <dt>API base path</dt>
              <dd>
                <code>/api</code> (proxied by Vite in development)
              </dd>
            </div>
            <div>
              <dt>Required import column</dt>
              <dd>Product name only</dd>
            </div>
          </dl>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Link to="/history" className="btn btn-secondary btn-sm">
              <Check size={14} aria-hidden="true" /> Review dataset history
            </Link>
            <Link to="/stores" className="btn btn-ghost btn-sm">
              Manage stores
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
