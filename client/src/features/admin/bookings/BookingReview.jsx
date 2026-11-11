import { useRef, useState } from 'react'
import { bookingApi } from '../../../api/bookingApi'
import { scheduleApi } from '../../../api/scheduleApi'
import { Dialog } from '../../../components/ui/Dialog'
import { addDays, formatDisplayDate, formatDisplayTime, formatStudioTimestamp, fromDateKey, studioTodayKey, toDateKey } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'

const loadAgenda = date => scheduleApi.getByDate(date)
const actionTitles = { confirm: 'Confirm appointment', move: 'Reschedule appointment', decline: 'Decline request', cancel: 'Cancel appointment', complete: 'Mark completed' }

export function BookingReview({ booking, refreshing, onRefresh, onSaved }) {
  const earliest = toDateKey(addDays(fromDateKey(studioTodayKey()), 1))
  const [action, setAction] = useState(null)
  const [date, setDate] = useState('')
  const [startTime, setStart] = useState('')
  const [endTime, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState(null)
  const [version, setVersion] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const saving = useRef(false)
  const needsReview = !booking.isExpired && ['on-hold', 'pending'].includes(booking.status)
  const isConfirmed = booking.status === 'confirmed'
  const changingSchedule = action === 'confirm' || action === 'move'
  const agenda = useAdminResource(changingSchedule && date >= earliest ? date : null, loadAgenda)
  const schedule = agenda.data?.schedule
  const boundaries = schedule?.boundaries || []
  const conflicts = schedule?.timeSlots.filter(slot => slot.time >= startTime && slot.time < endTime &&
    slot.status !== 'available' && String(slot.bookingId) !== String(booking._id)) || []
  const canSubmitRange = !agenda.loading && !agenda.error && !schedule?.blocked && date >= earliest &&
    boundaries.slice(0, -1).includes(startTime) && boundaries.includes(endTime) && endTime > startTime && !conflicts.length
  const closingRequest = action === 'decline' || action === 'cancel'
  const changed = Boolean(action && version !== booking.updatedAt)

  const open = next => {
    setError(null)
    setReason('')
    setDate(booking.preferredDate >= earliest ? booking.preferredDate : '')
    setStart('')
    setEnd('')
    setNotes(booking.adminNotes || '')
    setVersion(booking.updatedAt)
    setAction(next)
  }

  const save = async event => {
    event.preventDefault()
    if (saving.current || refreshing || changed || (changingSchedule && !canSubmitRange)) return
    saving.current = true
    setBusy(true)
    setError(null)
    const expectedUpdatedAt = version
    try {
      const result = changingSchedule
        ? await bookingApi.confirm(booking._id, { date, startTime, endTime, expectedUpdatedAt, adminNotes: notes })
        : await bookingApi.updateStatus(booking._id, { status: action === 'complete' ? 'completed' : 'cancelled', reason, expectedUpdatedAt, adminNotes: notes })
      setAction(null)
      onSaved(result.message)
    } catch (failure) {
      setError(failure)
      if (failure.status === 409) { onRefresh(); agenda.reload() }
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  const requestedDate = booking.requestedDate || booking.preferredDate
  const requestedTime = booking.requestedTime || booking.preferredTime
  return <div className="studio-review">
    <dl className="studio-review-facts">
      <div><dt>Requested</dt><dd>{formatDisplayDate(requestedDate)} · {formatDisplayTime(requestedTime)}</dd></div>
      <div><dt>Submitted</dt><dd>{formatStudioTimestamp(booking.createdAt)}</dd></div>
      {booking.holdExpiresAt && <div><dt>{booking.isExpired ? 'Hold expired' : 'Hold expires'}</dt><dd>{formatStudioTimestamp(booking.holdExpiresAt)}</dd></div>}
      {(isConfirmed || booking.status === 'completed' || booking.appointmentEnd) && <div><dt>Appointment</dt><dd>{formatDisplayDate(booking.preferredDate)} · {formatDisplayTime(booking.preferredTime)}{booking.appointmentEnd && `–${formatDisplayTime(booking.appointmentEnd)}`}</dd></div>}
    </dl>
    <div className="studio-actions">
      {needsReview && <><button type="button" className="studio-primary" disabled={refreshing} onClick={() => open('confirm')}>Confirm appointment</button><button type="button" className="studio-secondary" disabled={refreshing} onClick={() => open('decline')}>Decline request</button></>}
      {isConfirmed && <><button type="button" className="studio-primary" disabled={refreshing} onClick={() => open('move')}>Reschedule</button><button type="button" className="studio-secondary" disabled={refreshing} onClick={() => open('complete')}>Mark completed</button><button type="button" className="studio-plain" disabled={refreshing} onClick={() => open('cancel')}>Cancel appointment</button></>}
    </div>
    <section><h3>Tattoo idea</h3><p>{booking.notes || 'No notes supplied.'}</p><p className="studio-meta">{[booking.tattooPlacement, booking.tattooSize?.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</p>
      {booking.referenceImages?.length > 0 && <ul className="studio-references">{booking.referenceImages.map((reference, index) => <li key={reference.key}><a href={reference.url} target="_blank" rel="noreferrer"><img src={reference.url} alt={`Open reference ${index + 1}`} loading="lazy" /></a></li>)}</ul>}
    </section>
    <section><h3>Contact</h3><dl className="studio-review-facts"><div><dt>Email</dt><dd><a href={`mailto:${booking.email}`}>{booking.email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${booking.phone}`}>{booking.phone}</a></dd></div><div><dt>Instagram</dt><dd>{booking.instagramHandle}</dd></div></dl></section>
    {booking.adminNotes && <section><h3>Studio notes</h3><p>{booking.adminNotes}</p></section>}
    <section><h3>History</h3>{booking.statusHistory?.length ? <ol className="studio-history">
      {[...booking.statusHistory].reverse().map((entry, index) => <li key={entry._id || index}><span>{entry.reason || entry.status}</span><time dateTime={entry.changedAt}>{formatStudioTimestamp(entry.changedAt)}</time></li>)}
    </ol> : <p>No history recorded.</p>}</section>

    <Dialog open={Boolean(action)} onClose={() => { if (!busy) setAction(null) }} title={actionTitles[action] || 'Booking action'} className="studio-admin-dialog">
      <form className="studio-fields" onSubmit={save}>
        {changingSchedule && <>
          <label>Appointment date<input type="date" min={earliest} value={date} required onChange={event => { setDate(event.target.value); setStart(''); setEnd('') }} /></label>
          <div className="studio-field-pair">
            <label>Start<select required value={startTime} onChange={event => { setStart(event.target.value); setEnd('') }}><option value="">Choose time</option>{boundaries.slice(0, -1).map(time => <option key={time} value={time}>{formatDisplayTime(time)}</option>)}</select></label>
            <label>End<select required value={endTime} disabled={!startTime} onChange={event => setEnd(event.target.value)}><option value="">Choose time</option>{boundaries.filter(time => time > startTime).map(time => <option key={time} value={time}>{formatDisplayTime(time)}</option>)}</select></label>
          </div>
          {agenda.loading && <p role="status">Checking calendar…</p>}
          <AdminFeedback error={agenda.error} onRetry={agenda.reload} />
          {schedule?.blocked && <p role="status">The selected day is blocked.</p>}
          {conflicts.length > 0 && <p role="status">Unavailable at {conflicts.map(slot => formatDisplayTime(slot.time)).join(', ')}.</p>}
          {canSubmitRange && <p className="studio-range-review">{formatDisplayDate(date)} · {formatDisplayTime(startTime)}–{formatDisplayTime(endTime)} Philippine time</p>}
        </>}
        {closingRequest && <label>Reason<textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label>}
        {action === 'complete' && <p>Mark this appointment completed and keep its time closed.</p>}
        <label>Internal notes<textarea maxLength={1000} value={notes || ''} onChange={event => setNotes(event.target.value)} /></label>
        {changed && <div className="studio-feedback" role="status">
          <p>The booking was updated. Current status is {booking.isExpired ? 'hold expired' : booking.status}. {formatDisplayDate(booking.preferredDate)} · {formatDisplayTime(booking.preferredTime)}.</p>
          {booking.adminNotes && <p>Current studio notes: {booking.adminNotes}</p>}
          <button type="button" className="studio-plain" disabled={refreshing} onClick={() => setVersion(booking.updatedAt)}>Use updated booking</button>
        </div>}
        <AdminFeedback error={error} />
        <div className="studio-actions"><button type="submit" className="studio-primary" disabled={busy || refreshing || changed || (changingSchedule && !canSubmitRange)}>{busy ? 'Saving…' : actionTitles[action]}</button></div>
      </form>
    </Dialog>
  </div>
}
