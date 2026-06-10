import { useEffect, useMemo, useState } from 'react'
import { scheduleApi } from '../../api/scheduleApi'
import { AvailabilityCalendar } from '../../components/availability/AvailabilityCalendar'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'
import { toDateKey } from '../../utils/date'

function monthKey(date) {
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7)
}

export default function AdminAvailabilityPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const currentMonth = useMemo(() => monthKey(month), [month])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setMessage('')

    scheduleApi.getBlockedDates(currentMonth)
      .then((data) => {
        if (active) setBlockedDates(data.blockedDates || [])
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
  }, [currentMonth])

  const toggleDate = (date) => {
    const dateKey = toDateKey(date)
    if (!dateKey.startsWith(`${currentMonth}-`)) return

    setBlockedDates((current) => (
      current.includes(dateKey)
        ? current.filter((value) => value !== dateKey)
        : [...current, dateKey].sort()
    ))
    setMessage('')
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setMessage('')

    try {
      const data = await scheduleApi.saveBlockedDates({ month: currentMonth, blockedDates })
      setBlockedDates(data.blockedDates || [])
      setMessage(`Saved ${data.blockedDates?.length || 0} blocked day(s) for ${currentMonth}.`)
    } catch (nextError) {
      setError(nextError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5 p-5 lg:p-8">
      <div className="border border-ink/10 bg-white/55 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">Blocked Dates</p>
        <h1 className="mt-2 font-display text-4xl font-black italic leading-none text-ink">Monthly day selector</h1>
        <p className="mt-3 max-w-2xl font-body text-2xl leading-tight text-ash">
          Select individual dates to block for the displayed month, then save the month.
        </p>
      </div>

      {error && (
        <div className="border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">
          {error.message || 'Unable to update blocked dates.'}
        </div>
      )}
      {message && (
        <div className="border border-ink/15 bg-cream/50 p-4 font-mono text-xs uppercase tracking-[0.14em] text-ink">
          {message}
        </div>
      )}

      {loading ? (
        <Loader label="Loading blocked dates" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.35fr)] xl:items-start">
          <AvailabilityCalendar
            month={month}
            blockedDates={blockedDates}
            selectedDate={null}
            onDateSelect={toggleDate}
            onMonthChange={setMonth}
          />

          <aside className="border border-ink/10 bg-white/55 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">{currentMonth}</p>
            <h2 className="mt-2 font-display text-3xl italic text-ink">{blockedDates.length} blocked</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {blockedDates.length ? blockedDates.map((date) => (
                <span key={date} className="border border-leather/25 bg-leather/10 px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink">
                  {date}
                </span>
              )) : (
                <p className="font-body text-2xl leading-tight text-ash">No blocked days selected for this month.</p>
              )}
            </div>
            <Button className="mt-6 w-full" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Month'}
            </Button>
          </aside>
        </div>
      )}
    </section>
  )
}