import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Catches render-time throws (e.g. an unexpected undefined lookup) that
// would otherwise leave a blank white page mid-lecture with no way back
// short of manually editing the URL. Reload is the only recovery offered —
// this boundary doesn't know enough about the failure to do anything safer.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unerwarteter Fehler:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen market-bg flex items-center justify-center p-6">
          <div className="panel-warm p-8 max-w-sm w-full text-center space-y-4">
            <h2 className="font-display text-xl font-bold text-coral-400">Etwas ist schiefgelaufen</h2>
            <p className="text-mkt-400 text-sm font-mono">
              Ein unerwarteter Fehler ist aufgetreten. Ein Neuladen behebt das meistens.
            </p>
            <button className="btn-secondary w-full" onClick={() => window.location.reload()}>
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
