export function AdminFeedback({ error, onRetry }) {
  if (!error) return null
  return <div className="studio-feedback" role="alert">
    <p>{error.message || 'The request could not be completed.'}</p>
    {onRetry && <button type="button" className="studio-plain" onClick={onRetry}>Retry</button>}
  </div>
}
