import { useRef, useState } from 'react'
import { scheduleApi } from '../../../api/scheduleApi'
import { Dialog } from '../../../components/ui/Dialog'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'

const load = () => scheduleApi.getDefaults()

export function DefaultTimesDialog({ onClose, onSaved }) {
  const defaults = useAdminResource('defaults', load)
  const pendingRef = useRef(false)
  return <Dialog open title="Shop hours" className="studio-admin-dialog" onClose={() => { if (!pendingRef.current) onClose() }}>
    {defaults.loading && <p role="status">Loading shop hours…</p>}
    <AdminFeedback error={defaults.error} onRetry={defaults.reload} />
    {defaults.data && <DefaultTimesForm defaults={defaults.data} pendingRef={pendingRef} onClose={onClose} onSaved={onSaved} />}
  </Dialog>
}

function DefaultTimesForm({ defaults, pendingRef, onClose, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (pendingRef.current) return
    const fields = new FormData(event.currentTarget)
    const opening = fields.get('opening')
    const closing = fields.get('closing') === '00:00' ? '24:00' : fields.get('closing')
    pendingRef.current = true
    setBusy(true)
    setError(null)
    try {
      await scheduleApi.saveDefaults({ opening, closing })
      onSaved()
    } catch (failure) {
      setError(failure)
    } finally {
      pendingRef.current = false
      setBusy(false)
    }
  }

  return <form className="studio-fields" onSubmit={save}>
    <p className="studio-meta">Philippine time. Applies to dates without a saved schedule. Select 12:00 AM to close at midnight.</p>
    <fieldset disabled={busy} className="studio-field-pair">
      <label>Opens at<input type="time" name="opening" required defaultValue={defaults.times[0]} /></label>
      <label>Closes at<input type="time" name="closing" required defaultValue={defaults.endTime === '24:00' ? '00:00' : defaults.endTime} /></label>
    </fieldset>
    <AdminFeedback error={error} />
    <div className="studio-form-footer">
      <button type="button" className="studio-secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className="studio-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save shop hours'}</button>
    </div>
  </form>
}
