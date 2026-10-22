import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BellRing,
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  Database,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Sun,
  Store,
  TriangleAlert,
  UserRound,
  Workflow,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useUITheme } from '../context/UIThemeContext'
import { useProfile } from '../context/ProfileContext'
import { useOnClickOutside } from '../lib/hooks'
import { initialsOf } from '../lib/format'
import AiChatbotWidget from './AiChatbotWidget'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> }],
  },
  {
    title: 'Inventory',
    items: [
      { path: '/stores', label: 'Stores', icon: <Store size={17} /> },
      { path: '/compare', label: 'Compare stores', icon: <Scale size={17} /> },
      { path: '/inventory', label: 'Inventory', icon: <Boxes size={17} /> },
      { path: '/alerts', label: 'Alerts', icon: <TriangleAlert size={17} /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/analytics', label: 'Analytics', icon: <ChartNoAxesCombined size={17} /> },
      { path: '/insights', label: 'Insights', icon: <Sparkles size={17} /> },
    ],
  },
  {
    title: 'Data',
    items: [
      { path: '/history', label: 'Data health', icon: <Database size={17} /> },
      { path: '/audit', label: 'Audit log', icon: <ShieldCheck size={17} /> },
      { path: '/suppliers', label: 'Suppliers', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { path: '/settings', label: 'Settings', icon: <Settings size={17} /> },
      { path: '/onboarding', label: 'Onboarding', icon: <Workflow size={17} /> },
      { path: '/workstation', label: 'AI console', icon: <FlaskConical size={17} /> },
    ],
  },
]

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/stores': 'Stores',
  '/compare': 'Compare stores',
  '/inventory': 'Inventory',
  '/alerts': 'Alerts',
  '/analytics': 'Analytics',
  '/insights': 'Insights',
  '/history': 'Data health',
  '/audit': 'Audit log',
  '/suppliers': 'Suppliers',
  '/settings': 'Settings',
  '/onboarding': 'Onboarding',
  '/workstation': 'AI console',
  '/upload': 'Upload dataset',
}

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]
  if (/^\/stores\/\d+/.test(pathname)) return 'Store detail'
  if (pathname.startsWith('/stores/')) return 'Stores'
  return 'SmartCart AI'
}

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useUITheme()
  const { profile, signOut } = useProfile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(menuRef, () => setMenuOpen(false))

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = `${titleFor(location.pathname)} · SmartCart AI`
  }, [location.pathname])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/inventory?q=${encodeURIComponent(q)}` : '/inventory')
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {drawerOpen ? <div className="mobile-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" /> : null}

      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`} aria-label="Primary">
        <div className="sidebar-head">
          <Link to="/dashboard" className="brand-mark" aria-label="SmartCart AI home">
            <ShoppingBasket size={19} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="brand-name">
              <Link to="/dashboard">SmartCart AI</Link>
            </div>
            <div className="brand-tag">
              <span className="dot" aria-hidden="true" /> Inventory intelligence
            </div>
          </div>
          <button
            className="icon-btn menu-toggle"
            style={{ marginLeft: 'auto' }}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="nav-group-label">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Link to="/upload" className="btn btn-accent btn-sm" style={{ width: '100%' }}>
            Upload dataset
          </Link>
          <div className="text-faint" style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
            Connected to <strong>/api</strong> · local workspace
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button
            className="icon-btn menu-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="topbar-title truncate">{titleFor(location.pathname)}</div>
            <div className="topbar-context truncate">
              {profile ? `Local profile · ${profile.name}` : 'No local profile yet'}
            </div>
          </div>

          <div className="topbar-spacer" />

          <form className="topbar-search" onSubmit={submitSearch} role="search">
            <span className="input-icon" aria-hidden="true">
              <Search size={15} />
            </span>
            <label className="sr-only" htmlFor="global-search">
              Search inventory
            </label>
            <input
              id="global-search"
              className="input"
              type="search"
              placeholder="Search products, SKUs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <button
            className="icon-btn"
            onClick={() => navigate('/alerts')}
            aria-label="Alerts"
            title="Alerts"
          >
            <BellRing size={17} />
          </button>

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="avatar" aria-hidden="true">
                {initialsOf(profile?.name || 'Guest')}
              </span>
              <span className="who">{profile?.name || 'Guest'}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="menu" role="menu">
                <div className="menu-label">{profile ? profile.role : 'Not signed in'}</div>
                {profile ? (
                  <div style={{ padding: '2px 10px 10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Display profile stored in this browser only — the API has no account system.
                  </div>
                ) : (
                  <Link className="menu-item" role="menuitem" to="/login" onClick={() => setMenuOpen(false)}>
                    <UserRound size={16} /> Sign in locally
                  </Link>
                )}
                <div className="menu-sep" />
                <Link className="menu-item" role="menuitem" to="/settings" onClick={() => setMenuOpen(false)}>
                  <Settings size={16} /> Settings
                </Link>
                <Link className="menu-item" role="menuitem" to="/upload" onClick={() => setMenuOpen(false)}>
                  <Database size={16} /> Upload dataset
                </Link>
                <Link className="menu-item" role="menuitem" to="/onboarding" onClick={() => setMenuOpen(false)}>
                  <Workflow size={16} /> Workspace setup
                </Link>
                {profile ? (
                  <>
                    <div className="menu-sep" />
                    <button
                      className="menu-item danger"
                      role="menuitem"
                      onClick={() => {
                        signOut()
                        setMenuOpen(false)
                        toast.success('Local profile cleared from this browser')
                        navigate('/')
                      }}
                    >
                      <LogOut size={16} /> Clear local profile
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <main className="shell-content" id="main-content">
          <Outlet />
        </main>
      </div>

      {location.pathname !== '/workstation' ? <AiChatbotWidget /> : null}
    </div>
  )
}
