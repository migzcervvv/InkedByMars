import { useRef, useState } from 'react'
import { bookingApi } from '../../../api/bookingApi'
import { Dialog } from '../../../components/ui/Dialog'
import { formatDisplayDate, formatDisplayTime } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'

export function ConfirmedBookingDialog({ date, schedule, onClose, onSaved, onConflict }) {
  const [start, setStart] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const pending = useRef(false)

  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await bookingApi.create({ ...fields, preferredDate: date })
      onSaved()
    } catch (failure) {
      setError(failure)
      if (failure.status === 409) onConflict()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <Dialog open title="Record confirmed booking" className="studio-admin-dialog" onClose={() => { if (!pending.current) onClose() }}>
    <form className="studio-fields" onSubmit={submit}>
      <p>{formatDisplayDate(date)} · Philippine time</p>
      <AdminFeedback error={error} />
      <fieldset disabled={busy} className="studio-fields">
        <label>Client name<input name="clientName" required maxLength={100} /></label>
        <label>Instagram handle<input name="instagramHandle" required maxLength={100} /></label>
        <label>Placement<input name="tattooPlacement" required /></label>
        <div className="studio-field-pair">
          <label>Start<select name="preferredTime" required value={start} onChange={event => setStart(event.target.value)}>
            <option value="">Choose time</option>
            {schedule.timeSlots.filter(slot => slot.status === 'available').map(slot => <option key={slot.time} value={slot.time}>{formatDisplayTime(slot.time)}</option>)}
          </select></label>
          <label>End<select key={start} name="appointmentEnd" required disabled={!start}>
            <option value="">Choose time</option>
            {schedule.boundaries.filter(time => time > start).map(time => <option key={time} value={time}>{time === '24:00' ? 'Midnight' : formatDisplayTime(time)}</option>)}
          </select></label>
        </div>
        <button className="studio-primary" type="submit" disabled={!start}>{busy ? 'Saving…' : 'Confirm booking'}</button>
      </fieldset>
    </form>
  </Dialog>
}
