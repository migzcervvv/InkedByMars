import { CalendarDays } from 'lucide-react'
import { useAvailability } from '../hooks/useAvailability'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { formatDisplayDate } from '../utils/date'

export default function AvailabilityPage() {
  const { availability, loading, error } = useAvailability()

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Open Books</p>
        <h1 className="page-title">Availability</h1>
        {loading ? (
          <Loader label="Checking studio calendar" />
        ) : error ? (
          <div className="booking-panel text-red">{error.message}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {availability.map((day) => (
              <article key={day.date} className="border border-ink/15 bg-surface/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">{formatDisplayDate(day.date)}</p>
                    <h2 className="mt-3 font-display text-3xl italic text-ink">
                      {day.isFullyClosed ? 'Closed' : `${day.availableCount} open`}
                    </h2>
                  </div>
                  <CalendarDays className="text-red" size={20} />
                </div>
                <p className="mt-4 min-h-10 font-body text-2xl leading-tight text-ash">
                  {day.closureReason || (day.availableCount ? 'Consultation slots are currently available.' : 'No bookable slots remain.')}
                </p>
              </article>
            ))}
          </div>
        )}
        <Button to="/booking" className="mt-8">Choose a Time</Button>
      </div>
    </section>
  )
}

