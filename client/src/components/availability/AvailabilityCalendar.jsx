import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fromDateKey, studioTodayKey, toDateKey } from '../../utils/date'
import { getDateStatus } from './calendarModel'
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AvailabilityCalendar({ month, availabilityByDate = {}, blockedDates = [], bookedDates = [], selectedDate, onDateSelect, onMonthChange, disableUnavailable = false, loading = false, selectable = true, requireKnown = false }) {
  const monthDate = month instanceof Date ? new Date(month.getFullYear(), month.getMonth(), 1) : fromDateKey(`${month || studioTodayKey().slice(0, 7)}-01`)
  const label = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const first = monthDate.getDay()
  const dayCount = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((first + dayCount) / 7) * 7 }, (_, index) => index >= first && index < first + dayCount ? toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), index - first + 1)) : null)
  const selectedKey = selectedDate ? toDateKey(selectedDate) : ''
  const todayKey = studioTodayKey()
  const changeMonth = amount => onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() + amount, 1))
  return <div className="availability-calendar" aria-busy={loading}>
    <div className="calendar-heading"><button type="button" onClick={() => changeMonth(-1)} disabled={!onMonthChange || loading} className="icon-button" aria-label="Previous month"><ChevronLeft size={20} /></button><p aria-live="polite">{label}</p><button type="button" onClick={() => changeMonth(1)} disabled={!onMonthChange || loading} className="icon-button" aria-label="Next month"><ChevronRight size={20} /></button></div>
    <div className="calendar-weekdays" aria-hidden="true">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days">{cells.map((dateKey, index) => {
      if (!dateKey) return <span key={`empty-${index}`} />
      const status = getDateStatus({ dateKey, todayKey, day: availabilityByDate[dateKey], blocked: blockedDates.includes(dateKey), booked: bookedDates.includes(dateKey), requireKnown, loading })
      const canSelect = selectable && !['loading', 'past', 'unknown'].includes(status) && !(disableUnavailable && ['blocked', 'booked'].includes(status))
      return <button key={dateKey} type="button" disabled={!canSelect} onClick={() => onDateSelect?.(fromDateKey(dateKey))} className={`calendar-day calendar-day-${status} ${selectedKey === dateKey ? 'is-selected' : ''}`} aria-pressed={selectedKey === dateKey} aria-current={dateKey === todayKey ? 'date' : undefined} aria-label={`${fromDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, ${status}`}><span>{fromDateKey(dateKey).getDate()}</span><span className="calendar-day-mark" aria-hidden="true" /></button>
    })}</div>
    <div className="calendar-legend"><span><i className="legend-available" />Available</span><span><i className="legend-limited" />Limited</span><span><i className="legend-booked" />Booked / closed</span></div>
  </div>
}
