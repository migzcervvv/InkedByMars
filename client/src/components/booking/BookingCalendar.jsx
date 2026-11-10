import { AvailabilityCalendar } from '../availability/AvailabilityCalendar'
import { AppointmentSlot } from './AppointmentSlot'
import { formatDisplayDate } from '../../utils/date'
import { Loader } from '../ui/Loader'
import { Notice } from '../ui/Notice'

export function BookingCalendar({ availabilityByDate, dayAvailability, calendarMonth, selectedDate, selectedSlot, onDateChange, onMonthChange, onSlotChange, loading, rangeLoading, rangeError, dateError, onRetryRange, onRetryDate }) {
  return <section className="booking-calendar-panel" aria-labelledby="availability-heading" data-ui>
    <div className="booking-panel-heading"><h2 id="availability-heading">Find your time.</h2><p>Philippine time · UTC+8</p></div>
    {rangeError && <Notice tone="error" title="The calendar couldn’t connect." onRetry={onRetryRange} busy={rangeLoading}><p>Availability is unverified. Try again, or contact Mars through Instagram.</p></Notice>}
    <AvailabilityCalendar month={calendarMonth} availabilityByDate={rangeError ? {} : availabilityByDate} selectedDate={selectedDate} onDateSelect={onDateChange} onMonthChange={onMonthChange} disableUnavailable requireKnown loading={rangeLoading} />
    <div id="booking-time-step" className="date-slot-panel" aria-live="polite">
      {!selectedDate ? <p>Choose an available day to see the times.</p> : <><h3>{formatDisplayDate(selectedDate)}</h3>{loading ? <Loader label="Checking open times" /> : dateError ? <Notice tone="error" title="These times couldn’t load." onRetry={onRetryDate}><p>Try the date again before choosing a time.</p></Notice> : dayAvailability?.isFullyClosed ? <p>{dayAvailability.closureReason || 'The studio is closed on this day.'}</p> : dayAvailability?.slots?.length ? <div className="appointment-slots">{dayAvailability.slots.map(slot => <AppointmentSlot key={slot.time} time={slot.time} status={slot.available ? slot.status : slot.status === 'available' ? 'closed' : slot.status} selected={slot.time === selectedSlot} onSelect={() => onSlotChange(slot.time)} />)}</div> : <p>No open times were returned for this day. Choose another date or try again.</p>}</>}
    </div>
    <p className="booking-fine-print">Selecting a time doesn’t reserve it. The studio reviews your request before confirming your appointment.</p>
  </section>
}
