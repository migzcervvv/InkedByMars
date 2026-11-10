import { Button } from './Button'
export function Notice({ title, children, onRetry, busy = false, tone = 'neutral' }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{title && <p className="notice-title">{title}</p>}{children && <div className="notice-copy">{children}</div>}{onRetry && <Button variant="ghost" onClick={onRetry} disabled={busy}>{busy ? 'Checking…' : 'Try again'}</Button>}</div>
}
