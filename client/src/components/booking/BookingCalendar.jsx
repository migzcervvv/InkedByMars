import { AvailabilityCalendar } from '../availability/AvailabilityCalendar'
import { AppointmentSlot } from './AppointmentSlot'
import { formatDisplayDate, toDateKey } from '../../utils/date'
import { Loader } from '../ui/Loader'

export function BookingCalendar({
  availabilityByDate,
  dayAvailability,
  blockedDates,
  bookedDates,
  calendarMonth,
  selectedDate,
  selectedSlot,
  holdLoading,
  onDateChange,
  onMonthChange,
  onSlotChange,
  loading,
}) {
  const dateKey = toDateKey(selectedDate)
  const summary = availabilityByDate[dateKey]
  const slots = dayAvailability?.slots || []
  const isClosed = summary?.isFullyClosed || dayAvailability?.isFullyClosed

  return (
    <section className="booking-panel">
      <div className="mb-6">
        <p className="eyebrow">Choose Date</p>
        <h2 className="section-title mt-2 text-4xl">Availability</h2>
      </div>
      <AvailabilityCalendar
        month={calendarMonth}
        availabilityByDate={availabilityByDate}
        blockedDates={blockedDates}
        bookedDates={bookedDates}
        selectedDate={selectedDate}
        onDateSelect={onDateChange}
        onMonthChange={onMonthChange}
        disableUnavailable
        loading={loading}
      />
      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">{formatDisplayDate(selectedDate)}</p>
        {dayAvailability?.closureReason && (
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-red">
            {dayAvailability.closureReason}
          </p>
        )}
        {loading ? (
          <div className="mt-5">
            <Loader label="Loading slots" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {slots.length && !isClosed ? (
              slots.map((slot) => (
                <AppointmentSlot
                  key={slot.time}
                  time={slot.time}
                  status={slot.status}
                  selected={selectedSlot === slot.time}
                  loading={holdLoading === slot.time}
                  onSelect={() => onSlotChange(slot.time)}
                />
              ))
            ) : (
              <div className="col-span-full border border-ink/15 bg-cream/35 p-5 font-mono text-xs uppercase tracking-[0.14em] text-ash">
                No slots are available for this day.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}