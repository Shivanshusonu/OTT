import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, color: '#e8eaf0', fontFamily: 'system-ui, sans-serif',
          background: '#0f1117', minHeight: '100vh',
        }}>
          <div style={{
            maxWidth: 600, margin: '80px auto', background: '#1a1d27',
            border: '1px solid #2d3147', borderRadius: 12, padding: 32,
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ marginBottom: 12, color: '#ef4444' }}>Something went wrong</h2>
            <p style={{ color: '#8b90a8', marginBottom: 20, fontSize: 14 }}>{this.state.message}</p>
            <p style={{ color: '#8b90a8', fontSize: 13, marginBottom: 24 }}>
              Make sure the backend is running at{' '}
              <code style={{ color: '#3b82f6' }}>http://localhost:8000</code>
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
              style={{
                background: '#e50914', border: 'none', color: '#fff',
                borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
