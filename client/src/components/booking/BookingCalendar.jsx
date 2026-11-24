import { AvailabilityCalendar } from '../availability/AvailabilityCalendar'
import { Button } from '../ui/Button'
import { studio } from '../../config/studio'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import { Loader } from '../ui/Loader'
import { Notice } from '../ui/Notice'

export function BookingCalendar({ availabilityByDate, dayAvailability, calendarMonth, selectedDate, onDateChange, onMonthChange, loading, rangeLoading, rangeError, dateError, onRetryRange, onRetryDate, earliestDate, studioDate }) {
  const hours = dayAvailability?.hours
  const blockedRanges = dayAvailability?.blockedRanges ?? []
  const timeRange = (start, end) => formatDisplayTime(start) + ' – ' + (end === '24:00' ? 'midnight' : formatDisplayTime(end))
  return <section className="booking-calendar-panel" aria-labelledby="availability-heading" data-ui>
    <div className="booking-panel-heading"><h1 id="availability-heading">Tattoo availability</h1></div>
    <AvailabilityCalendar month={calendarMonth} availabilityByDate={rangeError ? {} : availabilityByDate} selectedDate={selectedDate} onDateSelect={onDateChange} onMonthChange={onMonthChange} earliestDate={earliestDate} studioDate={studioDate} requireKnown separateUnavailable loading={rangeLoading} />
    {rangeError && <Notice tone="error" title="The calendar couldn’t connect." onRetry={onRetryRange} busy={rangeLoading}><p>Availability is unverified. Try again, or contact Mars through Instagram.</p></Notice>}
    <div role="region" aria-label="Shop hours and blocked times" id="booking-time-step" className="date-slot-panel" aria-live="polite">
      {!selectedDate ? <p>{rangeLoading ? 'Checking open dates…' : rangeError ? 'Availability could not be checked.' : 'No open dates this month. Check the next month.'}</p> : <><h3>{formatDisplayDate(selectedDate)}</h3><p>Philippine time · UTC+8</p>{(loading || (!dayAvailability && !dateError)) ? <Loader label="Checking open times" /> : dateError ? <Notice tone="error" title="These times couldn’t load." onRetry={onRetryDate}><p>Refresh availability for this date.</p></Notice> : dayAvailability?.isFullyClosed ? <p>{'The studio is closed on this day.'}</p> : <>
          {hours && <dl className="booking-day-hours"><dt>Shop hours</dt><dd>{timeRange(hours.opening, hours.closing)}</dd></dl>}
          {dayAvailability?.isFullyBooked && <p>This date is fully booked.</p>}
          {blockedRanges.length ? <div className="booking-blocked-times"><h4>Unavailable</h4><ul>{blockedRanges.map(({ start, end }) => <li key={start}>{timeRange(start, end)}</li>)}</ul></div>
            : <p>No blocked times on this date.</p>}
        </>}</>}
    </div>
    <p className="booking-fine-print">Send your preferred date and time to Mars on Instagram to book.</p>
    <Button href={studio.instagram}>Message Mars on Instagram</Button>
  </section>
}
