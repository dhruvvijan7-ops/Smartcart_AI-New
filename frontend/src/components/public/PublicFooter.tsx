import { Link } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'

export default function PublicFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          <div>
            <div className="lp-logo" style={{ color: 'var(--lp-ivory)', marginBottom: 16 }}>
              <span className="mark coral" aria-hidden="true">
                <ShoppingBasket size={18} />
              </span>
              SmartCart AI
            </div>
            <p className="about">
              Inventory intelligence for multi-store retail: bring spreadsheets together, see expiry risk
              clearly, understand product performance and plan replenishment with transparent arithmetic.
            </p>
          </div>

          <div>
            <h4>Product</h4>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Features
            </a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>
              How it works
            </a>
            <a href="#analytics" onClick={(e) => { e.preventDefault(); document.querySelector('#analytics')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Analytics
            </a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' }) }}>
              FAQ
            </a>
          </div>

          <div>
            <h4>Platform</h4>
            <Link to="/dashboard">Open the app</Link>
            <Link to="/stores">Stores</Link>
            <Link to="/compare">Compare stores</Link>
            <Link to="/upload">Upload a dataset</Link>
            <Link to="/history">Data health</Link>
          </div>

          <div>
            <h4>Account</h4>
            <Link to="/login">Sign in</Link>
            <Link to="/forgot-password">Account recovery</Link>
            <Link to="/onboarding">Workspace setup</Link>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {year} SmartCart AI. Built for inventory operators.</span>
          <span>No customer logos, certifications or performance statistics are published on this site.</span>
        </div>
      </div>
    </footer>
  )
}
