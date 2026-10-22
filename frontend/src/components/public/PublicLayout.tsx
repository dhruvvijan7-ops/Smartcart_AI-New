import { Outlet } from 'react-router-dom'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'

export default function PublicLayout() {
  return (
    <div className="lp">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <PublicNavbar />
      <main id="main-content">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
