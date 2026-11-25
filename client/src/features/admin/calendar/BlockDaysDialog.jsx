import { useRef, useState } from 'react'
import { scheduleApi } from '../../../api/scheduleApi'
import { AvailabilityCalendar } from '../../../components/availability/AvailabilityCalendar'
import { Dialog } from '../../../components/ui/Dialog'
import { formatDisplayDate, toDateKey } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'

function hasReservation(day) {
  return day.timeSlots.some(slot => slot.status === 'booked' ||
    (slot.status === 'closed' && slot.bookingId) ||
    (slot.status === 'on-hold' && (!slot.holdExpiresAt || new Date(slot.holdExpiresAt) > new Date())))
}

export function BlockDaysDialog({ date, schedule, loadMonth, onClose, onSaved }) {
  const [month, setMonth] = useState(date.slice(0, 7))
  const [selection, setSelection] = useState(() => schedule.blocked || hasReservation(schedule) ? {} : { [date]: schedule.version })
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const calendar = useAdminResource(month, loadMonth)
  const schedules = calendar.data?.schedules || []
  const selected = Object.keys(selection).sort()
  const unavailable = calendar.loading || Boolean(calendar.error)

  function remove(key) {
    setSelection(previous => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  function toggle(value) {
    const key = toDateKey(value)
    setError(null)
    if (selected.includes(key)) return remove(key)
    if (selected.length === 31) {
      setError({ message: 'Save these dates before selecting more than 31.' })
      return
    }
    const version = schedules.find(day => day.date === key)?.__v ?? null
    setSelection(previous => ({ ...previous, [key]: version }))
  }

  async function save(event) {
    event.preventDefault()
    if (pending.current || unavailable || !selected.length) return
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await scheduleApi.blockDays(selected.map(date => ({ date, version: selection[date] })), reason)
      onSaved(selected.length)
    } catch (failure) {
      if (failure.status === 409 && failure.details?.date) {
        const conflict = failure.details.date
        remove(conflict)
        setMonth(conflict.slice(0, 7))
        calendar.reload()
        setError({ message: failure.message + ' The conflicting date was removed from your selection.' })
      } else setError(failure)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <Dialog open title="Block dates" className="studio-admin-dialog" onClose={() => { if (!pending.current) onClose() }}>
    <form className="studio-fields" onSubmit={save}>
      <p>Select up to 31 whole days. Dates with bookings or active holds cannot be blocked.</p>
      <AdminFeedback error={calendar.error} onRetry={calendar.reload} />
      <AvailabilityCalendar month={month} allowPast disableUnavailable
        loading={calendar.loading} selectable={!unavailable && !busy} selectedDates={selected}
        blockedDates={[...(calendar.data?.blockedDates || []), ...schedules.filter(day => ['holiday', 'fully_closed'].includes(day.dayStatus)).map(day => day.date)]}
        bookedDates={schedules.filter(hasReservation).map(day => day.date)}
        onDateSelect={toggle} onMonthChange={busy ? undefined : value => setMonth(toDateKey(value).slice(0, 7))} />
      <p role="status">{selected.length} {selected.length === 1 ? 'date' : 'dates'} selected</p>
      {selected.length > 0 && <ul className="studio-block-selection">{selected.map(key =>
        <li key={key}><button type="button" className="studio-secondary" disabled={busy}
          aria-label={'Remove ' + formatDisplayDate(key)} onClick={() => remove(key)}>{formatDisplayDate(key)} ×</button></li>
      )}</ul>}
      <label>Internal reason (optional)<textarea maxLength={500} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
      <AdminFeedback error={error} form />
      <div className="studio-actions"><button className="studio-primary" disabled={!selected.length || unavailable || busy}>
        {busy ? 'Saving…' : selected.length === 1 ? 'Block 1 day' : 'Block ' + selected.length + ' days'}
      </button></div>
    </form>
  </Dialog>
}
