import { useEffect, useState } from 'react'
import { scheduleApi } from '../../api/scheduleApi'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'
import { addMonths, formatDisplayDate, toDateKey } from '../../utils/date'

function defaultRange() {
  return { startDate: toDateKey(new Date()), endDate: toDateKey(addMonths(new Date(), 1)) }
}

export default function AdminAvailabilityPage() {
  const [range, setRange] = useState(defaultRange)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await scheduleApi.list(range)
      setSchedules(data.schedules || [])
    } catch (nextError) {
      setError(nextError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    scheduleApi.list(defaultRange())
      .then((data) => {
        if (active) setSchedules(data.schedules || [])
      })
      .catch((nextError) => {
        if (active) setError(nextError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="grid gap-5 p-5 lg:p-8">
      <div className="grid gap-3 border border-ink/10 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input className="field-input text-xl" type="date" value={range.startDate} onChange={(event) => setRange((current) => ({ ...current, startDate: event.target.value }))} />
        <input className="field-input text-xl" type="date" value={range.endDate} onChange={(event) => setRange((current) => ({ ...current, endDate: event.target.value }))} />
        <Button onClick={load}>Load Range</Button>
      </div>
      {error && <div className="border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">{error.message}</div>}
      {loading ? (
        <Loader label="Loading availability" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => {
            const available = schedule.timeSlots.filter((slot) => slot.status === 'available').length
            return (
              <article key={schedule._id} className="border border-ink/10 bg-white/55 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">{formatDisplayDate(schedule.date)}</p>
                <h2 className="mt-2 font-display text-3xl italic">{schedule.dayStatus}</h2>
                <p className="mt-3 font-body text-2xl leading-tight text-ash">{available} available of {schedule.timeSlots.length} slots</p>
                {schedule.closureReason && <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ash">{schedule.closureReason}</p>}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
