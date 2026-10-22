import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#060813', color: '#fff', padding: '3rem', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '650px', margin: '0 auto', background: '#0f172a', border: '1px solid #f43f5e', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ color: '#f43f5e', margin: '0 0 1rem' }}>⚠️ SmartCart AI Render Error</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>An uncaught error was caught by the Error Boundary:</p>
            <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', color: '#fb7185', fontSize: '0.85rem' }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '1.5rem', padding: '0.65rem 1.25rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
