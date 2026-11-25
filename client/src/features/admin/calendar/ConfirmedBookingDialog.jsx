import { formErrors } from '../../../utils/formValidation'
import { useRef, useState } from 'react'
import { scheduleApi } from '../../../api/scheduleApi'
import { addDays, fromDateKey, studioTodayKey, toDateKey } from '../../../utils/date'
import { useAdminResource } from '../useAdminResource'
import { bookingApi } from '../../../api/bookingApi'
import { Dialog } from '../../../components/ui/Dialog'
import { formatDisplayDate, formatDisplayTime } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'

const loadSchedule = date => scheduleApi.getByDate(date)

export function ConfirmedBookingDialog({ date, schedule, onClose, onSaved, onConflict }) {
  const minimumDate = toDateKey(addDays(fromDateKey(studioTodayKey()), 1))
  const [selectedDate, setDate] = useState(date || minimumDate)
  const [busy, setBusy] = useState(false)
  const agenda = useAdminResource(date || selectedDate < minimumDate ? null : selectedDate, loadSchedule)
  const day = schedule || agenda.data?.schedule
  const open = !day?.blocked && day?.timeSlots.some(slot => slot.status === 'available')

  return <Dialog open title="Add booking" className="studio-admin-dialog" onClose={() => { if (!busy) onClose() }}>
    {!date && <label className="studio-fields">Appointment date<input type="date" min={minimumDate} value={selectedDate} disabled={busy} onChange={event => setDate(event.target.value)} /></label>}
    {agenda.loading && <p role="status">Checking the calendar…</p>}
    <AdminFeedback error={agenda.error} onRetry={agenda.reload} />
    {day && !agenda.loading && !agenda.error && !open && <p>There are no open times on this date.</p>}
    {day && open && !agenda.error && <ConfirmedBookingForm key={selectedDate} date={selectedDate} schedule={day}
      busy={busy} setBusy={setBusy} refreshing={agenda.loading} onSaved={onSaved}
      onConflict={onConflict || agenda.reload} />}
  </Dialog>
}

function ConfirmedBookingForm({ date, schedule, busy, setBusy, refreshing, onSaved, onConflict }) {
  const [start, setStart] = useState('')
  const [error, setError] = useState(null)
  const pending = useRef(false)
  const attempt = useRef(null)

  async function submit(event) {
    event.preventDefault()
    if (pending.current || refreshing) return
    const validation = formErrors(event.currentTarget, { clientName: 'the client’s name', instagramHandle: 'an Instagram handle', tattooPlacement: 'the tattoo placement', preferredTime: 'a start time', appointmentEnd: 'an end time' })
    if (validation) {
      setError(validation)
      return
    }
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const payload = { ...fields, preferredDate: date }
    const signature = JSON.stringify(payload)
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() }
    }
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      const { booking } = await bookingApi.create({ ...payload, submissionKey: attempt.current.key })
      if (!booking?._id) {
        setError({ message: 'The website couldn’t confirm the save. Check the bookings list before trying again.' })
        return
      }
      onSaved(booking)
    } catch (failure) {
      const outdated = failure.fields?.phone || failure.fields?.email
      setError(outdated ? { message: 'The studio website is still asking for contact details that this form no longer uses. This booking could not be saved.' } : failure)
      if (failure.status === 409) onConflict()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <form className="studio-fields" noValidate onSubmit={submit}>
      <p>{formatDisplayDate(date)} · Philippine time</p>
      <AdminFeedback error={error} form />
      <fieldset disabled={busy || refreshing} className="studio-fields">
        <label>Client name<input name="clientName" required maxLength={100} /></label>
        <label>Instagram handle<input name="instagramHandle" required maxLength={100} /></label>
        <label>Placement<input name="tattooPlacement" required /></label>
        <div className="studio-field-pair">
          <label>Start<select name="preferredTime" aria-label="Start time" required value={start} onChange={event => setStart(event.target.value)}>
            <option value="">Choose time</option>
            {schedule.timeSlots.filter(slot => slot.status === 'available').map(slot => <option key={slot.time} value={slot.time}>{formatDisplayTime(slot.time)}</option>)}
          </select></label>
          <label>End<select key={start} name="appointmentEnd" aria-label="End time" required disabled={!start}>
            <option value="">Choose time</option>
            {schedule.boundaries.filter(time => time > start && !schedule.timeSlots.some(slot => slot.time >= start && slot.time < time && slot.status !== 'available')).map(time => <option key={time} value={time}>{time === '24:00' ? 'Midnight' : formatDisplayTime(time)}</option>)}
          </select></label>
        </div>
        <button className="studio-primary" type="submit" disabled={busy || refreshing}>{busy ? 'Saving…' : 'Confirm booking'}</button>
      </fieldset>
  </form>
}
