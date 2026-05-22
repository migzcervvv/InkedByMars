import { Component } from 'react'
import { Button } from './Button'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('React render error', error, errorInfo)
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <section className="grid min-h-[60vh] place-items-center bg-cream px-6 text-center text-ink">
        <div className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-red">Render error</p>
          <h1 className="mt-3 font-display text-5xl italic leading-none">Something broke.</h1>
          <p className="mt-4 font-body text-2xl leading-tight text-ash">
            The page failed to render. Retry the view, or return to the home page.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={this.reset}>Retry</Button>
            <Button to="/" variant="ghost">Home</Button>
          </div>
        </div>
      </section>
    )
  }
}

