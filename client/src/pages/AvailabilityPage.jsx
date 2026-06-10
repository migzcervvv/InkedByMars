// AvailabilityPage.jsx
import { useMemo, useState } from 'react'
import { AvailabilityCalendar } from '../components/availability/AvailabilityCalendar'
import { useAvailability } from '../hooks/useAvailability'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { addMonths, formatDisplayTime, fromDateKey, toDateKey } from '../utils/date'

function TimeSlotPanel({ dateKey, data, loading }) {
  if (!dateKey) return null

  const label = fromDateKey(dateKey).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mt-10 border border-ink/15 bg-surface/80 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">Time Slots</p>
      <h2 className="mt-1 font-display text-2xl italic text-ink">{label}</h2>

      <div className="mt-5">
        {loading ? (
          <Loader label="Loading slots" />
        ) : data?.isFullyClosed ? (
          <p className="font-body text-ash">{data.closureReason || 'Studio closed this day.'}</p>
        ) : data?.slots?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {data.slots.map((slot) => (
              <div
                key={slot.time}
                className={[
                  'border px-3 py-2 font-mono text-sm transition-colors',
                  slot.available
                    ? 'border-ink/20 text-ink'
                    : 'border-ink/8 text-ash/50 line-through',
                ].join(' ')}
              >
                {formatDisplayTime(slot.time)}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-ash">No bookable slots for this date.</p>
        )}
      </div>
    </div>
  )
}

export default function AvailabilityPage() {
  const {
    availability,
    availabilityByDate,
    selectedDateAvailability,
    loading,
    dateLoading,
    error,
    fetchDate,
  } = useAvailability()

  const [selectedDate, setSelectedDate] = useState(null)

  const today = new Date()
  const nextMonthDate = addMonths(today, 1)
  const blockedDates = useMemo(() => {
    return availability
      .filter((day) => day.isBlocked || day.isFullyClosed || day.availabilityStatus === 'blocked')
      .map((day) => day.date)
  }, [availability])
  const bookedDates = useMemo(() => {
    return availability
      .filter((day) => {
        const isBlocked = day.isBlocked || day.isFullyClosed || day.availabilityStatus === 'blocked'
        return !isBlocked && (day.isFullyBooked || day.availableCount === 0)
      })
      .map((day) => day.date)
  }, [availability])

  const handleSelect = (date) => {
    const dateKey = toDateKey(date)
    setSelectedDate(dateKey)
    fetchDate(dateKey)
  }

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Open Books</p>
        <h1 className="page-title">Availability</h1>

        {loading ? (
          <Loader label="Checking studio calendar" />
        ) : error ? (
          <div className="booking-panel text-red">
            {error.message || "Can't reach the server. Check your connection or try again in a moment."}
          </div>
        ) : (
          <>
            <div className="grid gap-10 sm:grid-cols-2">
              <AvailabilityCalendar
                month={today}
                availabilityByDate={availabilityByDate}
                blockedDates={blockedDates}
                bookedDates={bookedDates}
                selectedDate={selectedDate}
                onDateSelect={handleSelect}
              />
              <AvailabilityCalendar
                month={nextMonthDate}
                availabilityByDate={availabilityByDate}
                blockedDates={blockedDates}
                bookedDates={bookedDates}
                selectedDate={selectedDate}
                onDateSelect={handleSelect}
              />
            </div>

            <TimeSlotPanel
              dateKey={selectedDate}
              data={selectedDateAvailability}
              loading={dateLoading}
            />
          </>
        )}

        <Button to="/booking" className="mt-8">
          Choose a Time
        </Button>
      </div>
    </section>
  )
}