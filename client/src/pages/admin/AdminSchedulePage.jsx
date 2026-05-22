import { useEffect, useMemo, useState } from 'react'
import { scheduleApi } from '../../api/scheduleApi'
import { DAY_STATUS, SLOT_STATUS } from '../../config/app'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'
import { formatDisplayTime, toDateKey } from '../../utils/date'

export default function AdminSchedulePage() {
  const [date, setDate] = useState(toDateKey(new Date()))
  const [schedule, setSchedule] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [busySlot, setBusySlot] = useState('')
  const [error, setError] = useState(null)

  const slots = useMemo(() => schedule?.timeSlots || [], [schedule])

  useEffect(() => {
    let active = true

    scheduleApi.getByDate(date)
      .then((data) => {
        if (active) setSchedule(data.schedule)
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
  }, [date])

  const blockDay = async (dayStatus) => {
    setLoading(true)
    try {
      const data = await scheduleApi.blockDay({ date, dayStatus, closureReason: reason || dayStatus })
      setSchedule(data.schedule)
    } catch (nextError) {
      setError(nextError)
    } finally {
      setLoading(false)
    }
  }

  const toggleSlot = async (slot) => {
    setBusySlot(slot.time)
    try {
      const data = slot.status === SLOT_STATUS.available
        ? await scheduleApi.blockSlot({ date, time: slot.time, reason: reason || 'Admin blocked' })
        : await scheduleApi.releaseSlot({ date, time: slot.time })
      setSchedule(data.schedule)
    } catch (nextError) {
      setError(nextError)
    } finally {
      setBusySlot('')
    }
  }

  return (
    <section className="grid gap-5 p-5 lg:grid-cols-[360px_1fr] lg:p-8">
      <aside className="border border-ink/10 bg-white/55 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">Calendar management</p>
        <h2 className="mt-2 font-display text-4xl italic">Daily Schedule</h2>
        <div className="mt-6 grid gap-4">
          <label className="field-label">
            Date
            <input className="field-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field-label">
            Reason
            <input className="field-input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Travel, flash day, private session" />
          </label>
          <Button onClick={() => blockDay(DAY_STATUS.fullyClosed)}>Close Full Day</Button>
          <Button variant="leather" onClick={() => blockDay(DAY_STATUS.holiday)}>Mark Holiday</Button>
          <Button variant="ghost" onClick={() => blockDay(DAY_STATUS.open)}>Reopen Day</Button>
        </div>
      </aside>

      <div className="border border-ink/10 bg-white/55 p-5">
        {error && <div className="mb-4 border border-red bg-red/10 p-3 font-mono text-xs uppercase tracking-[0.14em] text-red">{error.message}</div>}
        {loading ? (
          <Loader label="Loading schedule" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">{schedule?.date}</p>
                <h2 className="font-display text-4xl italic">{schedule?.dayStatus}</h2>
              </div>
              {schedule?.closureReason && <p className="font-mono text-xs uppercase tracking-[0.14em] text-red">{schedule.closureReason}</p>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.status === SLOT_STATUS.booked || busySlot === slot.time}
                  onClick={() => toggleSlot(slot)}
                  className={`slot slot-${slot.status === 'on-hold' ? 'pending' : slot.status}`}
                >
                  <span>{formatDisplayTime(slot.time)}</span>
                  <span>{busySlot === slot.time ? 'Saving' : slot.status}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
