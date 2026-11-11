import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { scheduleApi } from '../../../api/scheduleApi'
import { AvailabilityCalendar } from '../../../components/availability/AvailabilityCalendar'
import { formatDisplayDate, formatDisplayTime, endOfMonth, fromDateKey, startOfMonth, studioTodayKey, toDateKey } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'
import { ClosureDialog } from './ClosureDialog'

const loadDay = date => scheduleApi.getByDate(date)
const loadMonth = month => scheduleApi.list({
  startDate: `${month}-01`, endDate: toDateKey(endOfMonth(fromDateKey(`${month}-01`))),
})
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && toDateKey(fromDateKey(value)) === value
const statusText = { available: 'Open', 'on-hold': 'On hold', booked: 'Confirmed', closed: 'Blocked' }

export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const today = studioTodayKey()
  const selected = params.get('date')
  const monthParam = params.get('month')
  const month = validDate(selected) ? selected.slice(0, 7) : validDate(`${monthParam}-01`) ? monthParam : today.slice(0, 7)
  const date = validDate(selected) ? selected : today.startsWith(month) ? today : `${month}-01`
  const mobileAgenda = validDate(selected)
  const days = useAdminResource(month, loadMonth)
  const agenda = useAdminResource(date, loadDay)
  const schedule = agenda.data?.schedule
  const [operation, setOperation] = useState(null)
  const [message, setMessage] = useState('')
  const agendaTitle = useRef(null)
  const backTo = useRef(null)
  const previous = useRef(false)

  useEffect(() => {
    if (mobileAgenda && !previous.current) {
      agendaTitle.current?.focus({ preventScroll: true })
      if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo(0, 0)
    }
    if (!mobileAgenda && previous.current && backTo.current) {
      backTo.current.element?.focus({ preventScroll: true })
      if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo(0, backTo.current.scroll)
    }
    previous.current = mobileAgenda
  }, [mobileAgenda])

  const select = value => {
    setMessage('')
    backTo.current = { element: document.activeElement, scroll: window.scrollY }
    setParams({ month, date: toDateKey(value) })
  }
  const refresh = () => { agenda.reload(); days.reload() }
  const monthData = days.data?.schedules || []
  const dayMarks = Object.fromEntries(monthData.map(day => {
    const blocked = ['fully_closed', 'holiday'].includes(day.dayStatus)
    const occupied = day.timeSlots.filter(slot => slot.status !== 'available' &&
      (slot.status !== 'on-hold' || !slot.holdExpiresAt || new Date(slot.holdExpiresAt) > new Date())).length
    return [day.date, {
      isBlocked: blocked, isFullyBooked: occupied === day.timeSlots.length,
      isPartiallyBooked: occupied > 0 && occupied < day.timeSlots.length,
    }]
  }))
  const editable = schedule && !agenda.loading && !agenda.error

  return <div className="studio-screen">
    <header className="studio-screen-heading"><h1>Calendar</h1><p>All times in Philippine time</p></header>
    <div className={`studio-calendar-workspace ${mobileAgenda ? 'studio-detail-active' : ''}`}>
      <section className="studio-panel studio-month" aria-label="Calendar month">
        <AdminFeedback error={days.error} onRetry={days.reload} />
        <AvailabilityCalendar month={month} selectedDate={date} allowPast requireKnown={!days.data || Boolean(days.error)} loading={days.loading && !days.data}
          availabilityByDate={dayMarks} blockedDates={days.data?.blockedDates} onDateSelect={select}
          onMonthChange={next => { setMessage(''); setParams({ month: toDateKey(startOfMonth(next)).slice(0, 7) }) }} />
      </section>
      <section className="studio-panel studio-day" aria-labelledby="studio-day-heading">
        {mobileAgenda && <button type="button" className="studio-plain studio-back" onClick={() => setParams({ month }, { replace: true })}>Back to month</button>}
        <div className="studio-detail-header">
          <h2 id="studio-day-heading" tabIndex={-1} ref={agendaTitle}>{formatDisplayDate(date)}</h2>
          {schedule?.blocked && <span className="status-badge" data-status="cancelled">Day blocked</span>}
        </div>
        {message && <p className="studio-result" role="status">{message}</p>}
        <AdminFeedback error={agenda.error} onRetry={agenda.reload} />
        {agenda.loading && !schedule && <p role="status">Loading agenda…</p>}
        {schedule && <>
          {schedule.closureReason && <p className="studio-meta">{schedule.closureReason}</p>}
          <div className="studio-actions">
            {schedule.blocked ? <button type="button" className="studio-primary" disabled={!editable} onClick={() => setOperation({ action: 'unblock-day' })}>Unblock whole day</button> :
              <><button type="button" className="studio-primary" disabled={!editable} onClick={() => setOperation({ action: 'block-range' })}>Block time range</button>
              <button type="button" className="studio-secondary" disabled={!editable} onClick={() => setOperation({ action: 'block-day' })}>Block whole day</button></>}
          </div>
          <ul className="studio-agenda" aria-label="Time slots">
            {schedule.timeSlots.map(slot => <li key={slot.time}>
              <time dateTime={slot.time}>{formatDisplayTime(slot.time)}</time>
              <div><strong>{schedule.blocked && slot.status === 'available' ? 'Blocked' : statusText[slot.status] || 'Unknown'}</strong>
                {slot.bookingId && <Link to={`/admin/bookings?view=all&booking=${slot.bookingId}`}>{slot.clientName || 'View booking'}</Link>}
                {!slot.bookingId && slot.reason && <span>{slot.reason}</span>}
              </div>
              {slot.canUnblock && !schedule.blocked && <button type="button" className="studio-plain" disabled={!editable}
                aria-label={`Unblock ${formatDisplayTime(slot.time)}`} onClick={() => setOperation({ action: 'unblock-range', startTime: slot.time, endTime: schedule.boundaries[schedule.boundaries.indexOf(slot.time) + 1] })}>Unblock</button>}
            </li>)}
          </ul>
        </>}
        {operation && schedule && <ClosureDialog key={`${date}|${operation.action}`} date={date} schedule={schedule} initial={operation}
          refreshing={!editable} onClose={() => setOperation(null)} onConflict={refresh}
          onSaved={() => {
            setOperation(null)
            setMessage(operation.action.startsWith('unblock') ? 'Closure removed.' : 'Time blocked.')
            refresh()
            requestAnimationFrame(() => agendaTitle.current?.focus({ preventScroll: true }))
          }} />}
      </section>
    </div>
  </div>
}
