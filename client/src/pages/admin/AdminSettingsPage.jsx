import { useState } from 'react'
import { scheduleApi } from '../../api/scheduleApi'
import { Button } from '../../components/ui/Button'
import { toDateKey } from '../../utils/date'

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    scope: 'this_week',
    startDate: toDateKey(new Date()),
    endDate: toDateKey(new Date()),
    openTime: '09:00',
    closeTime: '18:00',
    reason: 'Outside opening hours',
  })
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await scheduleApi.getByDate(form.startDate)
      setSlots(data.schedule.timeSlots.map((slot) => slot.time))
      setMessage(`Loaded ${data.schedule.timeSlots.length} backend slots for opening-hour updates.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  const apply = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const activeSlots = slots.length ? slots : (await scheduleApi.getByDate(form.startDate)).schedule.timeSlots.map((slot) => slot.time)
      const results = await scheduleApi.applyOpeningWindow({ ...form, slots: activeSlots })
      const failed = results.filter((result) => result.status === 'rejected')
      setMessage(`Opening hours applied. ${results.length - failed.length} updates succeeded${failed.length ? `, ${failed.length} need review` : ''}.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <section className="p-5 lg:p-8">
      <div className="max-w-3xl border border-ink/10 bg-white/55 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">Schedule settings</p>
        <h2 className="mt-2 font-display text-4xl italic">Opening Hours</h2>
        <p className="mt-3 font-body text-2xl leading-tight text-ash">
          This applies the backend's existing slot model across a chosen scope by releasing slots inside the window and blocking slots outside it.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Scope
            <select className="field-input" value={form.scope} onChange={(event) => setField('scope', event.target.value)}>
              <option value="this_week">This week only</option>
              <option value="this_month">This month</option>
              <option value="range">Range of days</option>
              <option value="forever">Forever forward</option>
            </select>
          </label>
          <label className="field-label">
            Reason
            <input className="field-input" value={form.reason} onChange={(event) => setField('reason', event.target.value)} />
          </label>
          <label className="field-label">
            Start date
            <input className="field-input" type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} />
          </label>
          <label className="field-label">
            End date
            <input className="field-input" type="date" value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} />
          </label>
          <label className="field-label">
            Open
            <input className="field-input" type="time" value={form.openTime} onChange={(event) => setField('openTime', event.target.value)} />
          </label>
          <label className="field-label">
            Close
            <input className="field-input" type="time" value={form.closeTime} onChange={(event) => setField('closeTime', event.target.value)} />
          </label>
        </div>

        {message && <p className="mt-5 border border-ink/10 bg-cream/80 p-3 font-mono text-xs uppercase tracking-[0.12em] text-ash">{message}</p>}
        {error && <p className="mt-5 border border-red bg-red/10 p-3 font-mono text-xs uppercase tracking-[0.12em] text-red">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={loadSlots} disabled={loading}>{loading ? 'Working...' : 'Load Backend Slots'}</Button>
          <Button onClick={apply} disabled={loading}>{loading ? 'Applying...' : 'Apply Hours'}</Button>
        </div>
      </div>
    </section>
  )
}

