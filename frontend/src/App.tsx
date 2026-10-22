import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { UIThemeProvider } from './context/UIThemeContext'
import { ProfileProvider } from './context/ProfileContext'
import PublicLayout from './components/public/PublicLayout'
import AppShell from './components/AppShell'

import Landing from './pages/public/Landing'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import NotFound from './pages/NotFound'

import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import AuditTrail from './pages/AuditTrail'
import Onboarding from './pages/Onboarding'
import Suppliers from './pages/Suppliers'
import AiConsole from './pages/AiConsole'

import Stores from './pages/stores/Stores'
import StoreDetail from './pages/stores/StoreDetail'
import AddStore from './pages/stores/AddStore'
import UploadWizard from './pages/data/UploadWizard'
import Compare from './pages/stores/Compare'
import DataHealth from './pages/data/DataHealth'

export default function App() {
  return (
    <UIThemeProvider>
      <ProfileProvider>
        <BrowserRouter>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/new" element={<AddStore />} />
              <Route path="/stores/:storeId" element={<StoreDetail />} />
              <Route path="/upload" element={<UploadWizard />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/history" element={<DataHealth />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/workstation" element={<AiConsole />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </UIThemeProvider>
  )
}
