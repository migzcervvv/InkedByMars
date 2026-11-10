import { Component } from 'react'
import { Button } from './Button'
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { if (import.meta.env.DEV) console.error('Page error', error, info) }
  render() {
    if (!this.state.error) return this.props.children
    return <main className="frame recovery-page"><h1>This page couldn’t open.</h1><p>Please reload the page or return to the studio.</p><div className="flex flex-wrap gap-6"><Button onClick={() => window.location.reload()}>Reload</Button><Button href="/" variant="ghost">Home</Button></div></main>
  }
}
