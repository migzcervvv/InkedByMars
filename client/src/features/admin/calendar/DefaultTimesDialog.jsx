import { useRef, useState } from 'react'
import { scheduleApi } from '../../../api/scheduleApi'
import { Dialog } from '../../../components/ui/Dialog'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'

const load = () => scheduleApi.getDefaults()

export function DefaultTimesDialog({ onClose, onSaved }) {
  const defaults = useAdminResource('defaults', load)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const form = new FormData(event.currentTarget)
    const times = form.get('times').trim().split(/[\s,]+/).filter(Boolean)
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await scheduleApi.saveDefaults({ times, endTime: form.get('endTime').trim() })
      onSaved()
    } catch (failure) {
      setError(failure)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <Dialog open title="Default time slots" className="studio-admin-dialog" onClose={() => { if (!pending.current) onClose() }}>
    {defaults.loading && <p role="status">Loading default times…</p>}
    <AdminFeedback error={defaults.error} onRetry={defaults.reload} />
    {defaults.data && <form className="studio-fields" onSubmit={save}>
      <p>These Philippine times apply to dates without a saved schedule.</p>
      <label>Start times
        <textarea name="times" required maxLength={500} defaultValue={defaults.data.times.join(', ')} aria-describedby="default-times-help" />
      </label>
      <p className="studio-meta" id="default-times-help">Use 24-hour times separated by commas or new lines.</p>
      <label>End of final slot<input name="endTime" required maxLength={5} defaultValue={defaults.data.endTime} /></label>
      <AdminFeedback error={error} />
      <div className="studio-actions"><button className="studio-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save default times'}</button></div>
    </form>}
  </Dialog>
}
