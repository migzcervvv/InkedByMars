import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { scheduleApi } from '../../../api/scheduleApi'
import { Dialog } from '../../../components/ui/Dialog'
import { formatDisplayTime } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'

const load = () => scheduleApi.getDefaults()

export function DefaultTimesDialog({ onClose, onSaved }) {
  const defaults = useAdminResource('defaults', load)
  const pendingRef = useRef(false)
  return <Dialog open title="Default time slots" className="studio-admin-dialog" onClose={() => { if (!pendingRef.current) onClose() }}>
    {defaults.loading && <p role="status">Loading default times…</p>}
    <AdminFeedback error={defaults.error} onRetry={defaults.reload} />
    {defaults.data && <DefaultTimesForm defaults={defaults.data} pendingRef={pendingRef} onClose={onClose} onSaved={onSaved} />}
  </Dialog>
}

function DefaultTimesForm({ defaults, pendingRef, onClose, onSaved }) {
  const [slots, setSlots] = useState(() => defaults.times.map((time, id) => ({ id, time })))
  const [closeTime, setCloseTime] = useState(defaults.endTime === '24:00' ? '00:00' : defaults.endTime)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const nextId = useRef(defaults.times.length)
  const list = useRef(null)
  const addButton = useRef(null)

  function addSlot() {
    const id = nextId.current++
    setSlots(current => [...current, { id, time: '' }])
    setError(null)
    requestAnimationFrame(() => list.current?.querySelector(`[data-slot-id="${id}"]`)?.focus())
  }

  function removeSlot(index) {
    const next = slots[index + 1] || slots[index - 1]
    setSlots(current => current.filter((_, position) => position !== index))
    setError(null)
    requestAnimationFrame(() => {
      const field = list.current?.querySelector(`[data-slot-id="${next.id}"]`)
      const target = field || addButton.current
      target?.focus()
    })
  }

  async function save(event) {
    event.preventDefault()
    if (pendingRef.current) return
    const times = slots.map(slot => slot.time)
    const endTime = closeTime === '00:00' ? '24:00' : closeTime
    if (times.some((time, index) => index && time <= times[index - 1])) {
      setError({ message: 'Each start time must be later than the previous one.' })
      return
    }
    if (times.at(-1) >= endTime) {
      setError({ message: 'The end of the final slot must be after its start time.' })
      return
    }
    pendingRef.current = true
    setBusy(true)
    setError(null)
    try {
      await scheduleApi.saveDefaults({ times, endTime })
      onSaved()
    } catch (failure) {
      setError(failure)
    } finally {
      pendingRef.current = false
      setBusy(false)
    }
  }

  return <form className="studio-fields studio-times-form" onSubmit={save}>
    <p className="studio-meta">Philippine time. Applies to dates without a saved schedule.</p>
    <div className="studio-time-grid studio-time-labels" aria-hidden="true"><span>Starts</span><span>Ends</span><span /></div>
    <ol className="studio-time-list" ref={list}>
      {slots.map(({ id, time }, index) => {
        const end = index === slots.length - 1 ? closeTime : slots[index + 1].time
        return <li key={id} className="studio-time-grid">
          <input type="time" required value={time} data-slot-id={id} aria-label={`Start time for slot ${index + 1}`} onChange={event => {
            const value = event.target.value
            setSlots(current => current.map(slot => slot.id === id ? { ...slot, time: value } : slot))
            setError(null)
          }} />
          <span className="studio-time-end">{end ? formatDisplayTime(end) : '—'}</span>
          <button type="button" className="icon-button studio-remove-time" disabled={slots.length === 1 || busy}
            aria-label={`Remove slot ${index + 1}`} onClick={() => removeSlot(index)}><Trash2 size={17} aria-hidden="true" /></button>
        </li>
      })}
    </ol>
    <div className="studio-time-tools">
      <button ref={addButton} type="button" className="studio-secondary studio-icon-action" disabled={slots.length >= 48 || busy} onClick={addSlot}><Plus size={16} aria-hidden="true" />Add time slot</button>
      <label>End of final slot<input type="time" required value={closeTime} onChange={event => { setCloseTime(event.target.value); setError(null) }} /></label>
    </div>
    {closeTime === '00:00' && <p className="studio-meta">The final slot ends at midnight.</p>}
    <AdminFeedback error={error} />
    <div className="studio-form-footer">
      <button type="button" className="studio-secondary" disabled={busy} onClick={onClose}>Cancel</button>
      <button className="studio-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save default times'}</button>
    </div>
  </form>
}
