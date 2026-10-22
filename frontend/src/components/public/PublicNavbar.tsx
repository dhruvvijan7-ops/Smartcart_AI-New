import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, ShoppingBasket, X } from 'lucide-react'

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#faq', label: 'FAQ' },
]

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const goSection = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    const el = document.querySelector(href)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    if (history.replaceState) history.replaceState(null, '', href)
  }

  return (
    <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="lp-container lp-nav-inner">
        <Link to="/" className="lp-logo" aria-label="SmartCart AI home">
          <span className="mark" aria-hidden="true">
            <ShoppingBasket size={18} />
          </span>
          SmartCart AI
        </Link>

        <nav className="lp-links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} className="lp-link" href={l.href} onClick={goSection(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-actions">
          <Link to="/login" className="btn btn-lp-secondary btn-sm desktop-only">
            Sign in
          </Link>
          <Link to="/dashboard" className="btn btn-lp-primary btn-sm desktop-only">
            Get started
          </Link>
        </div>

        <button
          className="lp-burger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="lp-mobile-menu" id="lp-mobile-menu">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={goSection(l.href)}>
              {l.label}
            </a>
          ))}
          <Link to="/login" className="btn btn-lp-secondary btn-lg">
            Sign in
          </Link>
          <Link to="/dashboard" className="btn btn-lp-primary btn-lg">
            Get started
          </Link>
        </div>
      ) : null}
    </header>
  )
}
