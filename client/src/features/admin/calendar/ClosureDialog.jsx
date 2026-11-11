import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { scheduleApi } from '../../../api/scheduleApi'
import { Dialog } from '../../../components/ui/Dialog'
import { formatDisplayDate, formatDisplayTime } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'

const titles = { 'block-day': 'Block whole day', 'block-range': 'Block time range', 'unblock-day': 'Unblock whole day', 'unblock-range': 'Unblock time' }

export function ClosureDialog({ date, schedule, initial, refreshing, onClose, onConflict, onSaved }) {
  const [startTime, setStart] = useState(initial.startTime || '')
  const [endTime, setEnd] = useState(initial.endTime || '')
  const [reason, setReason] = useState('')
  const [version, setVersion] = useState(schedule.version)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const { action } = initial
  const range = action.endsWith('range')
  const blocking = action.startsWith('block')
  const changed = version !== schedule.version
  const valid = !range || (schedule.boundaries.includes(startTime) && schedule.boundaries.includes(endTime) && startTime < endTime)
  const conflicts = blocking && valid ? schedule.timeSlots.filter(slot => (!range || (slot.time >= startTime && slot.time < endTime)) &&
    (['booked', 'on-hold'].includes(slot.status) || (slot.status === 'closed' && slot.bookingId))) : []

  const save = async event => {
    event.preventDefault()
    if (pending.current || refreshing || changed || !valid || conflicts.length) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await scheduleApi.changeClosure(date, { action, version, reason, ...(range && { startTime, endTime }) })
      onSaved()
    } catch (failure) {
      setError(failure)
      if (failure.status === 409) onConflict()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <Dialog open onClose={() => { if (!busy) onClose() }} title={titles[action]} className="studio-admin-dialog">
    <form className="studio-fields" onSubmit={save}>
      <p>{formatDisplayDate(date)} · Philippine time</p>
      {range && <div className="studio-field-pair">
        <label>Start<select value={startTime} required onChange={event => { setStart(event.target.value); setEnd('') }}>
          <option value="">Choose time</option>{schedule.boundaries.slice(0, -1).map(time => <option key={time} value={time}>{formatDisplayTime(time)}</option>)}
        </select></label>
        <label>End<select value={endTime} required disabled={!startTime} onChange={event => setEnd(event.target.value)}>
          <option value="">Choose time</option>{schedule.boundaries.filter(time => time > startTime).map(time => <option key={time} value={time}>{formatDisplayTime(time)}</option>)}
        </select></label>
      </div>}
      {blocking && <label>Internal reason (optional)<textarea maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label>}
      {valid && <p className="studio-range-review">{range ? `${formatDisplayTime(startTime)}–${formatDisplayTime(endTime)}` : 'Whole day'} · {blocking ? 'Mark non-bookable' : 'Remove studio closure'}</p>}
      {conflicts.length > 0 && <div className="studio-feedback" role="status">
        <p>These times are reserved. Review the bookings before blocking time.</p>
        <ul>{conflicts.map(slot => <li key={slot.time}>{formatDisplayTime(slot.time)}{slot.bookingId && <> · <Link to={`/admin/bookings?view=all&booking=${slot.bookingId}`}>{slot.clientName || 'View booking'}</Link></>}</li>)}</ul>
      </div>}
      {changed && <div className="studio-feedback" role="status">
        <p>The agenda changed while you were editing. Review the range and any reserved slots shown above.</p>
        <button type="button" className="studio-plain" disabled={refreshing} onClick={() => setVersion(schedule.version)}>Use updated agenda</button>
      </div>}
      <AdminFeedback error={error} />
      <div className="studio-actions"><button type="submit" className="studio-primary" disabled={!valid || Boolean(conflicts.length) || refreshing || changed || busy}>{busy ? 'Saving…' : titles[action]}</button></div>
    </form>
  </Dialog>
}
