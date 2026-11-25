import { useEffect, useRef } from 'react'

export function AdminFeedback({ error, onRetry, form = false }) {
  const summary = useRef(null)
  useEffect(() => {
    if (form && error) summary.current?.focus()
  }, [error, form])

  if (!error) return null
  const fields = [...new Set(Object.values(error.fields || {}).filter(Boolean))]
  const heading = fields.length ? 'Check the following details.' : error.message || 'The request could not be completed. Try again.'
  return <div className="studio-feedback" role="alert" tabIndex={form ? -1 : undefined} ref={summary}>
    <p>{fields.length === 1 ? fields[0] : heading}</p>
    {fields.length > 1 && <ul>{fields.map(message => <li key={message}>{message}</li>)}</ul>}
    {onRetry && <button type="button" className="studio-plain" onClick={onRetry}>Retry</button>}
  </div>
}
