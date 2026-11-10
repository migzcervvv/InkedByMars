import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { bookingApi } from '../../api/bookingApi'
import { scheduleApi } from '../../api/scheduleApi'
import { BookingTable } from '../../components/admin/BookingTable'
import { BookingDetailModal } from '../../components/admin/BookingDetailModal'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'

const initialFilters = { status: '', date: '', email: '', page: 1, limit: 20 }

function addHour(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function getBoundaries(schedule) {
  const times = (schedule?.timeSlots || []).map((slot) => slot.time).sort()
  if (!times.length) return []
  return [...times, addHour(times[times.length - 1])]
}

function getNextBoundary(boundaries, startTime) {
  const index = boundaries.indexOf(startTime)
  return boundaries[index + 1] || addHour(startTime)
}

export default function AdminBookingsPage() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking')
  const [filters, setFilters] = useState(initialFilters)
  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [actualDate, setActualDate] = useState('')
  const [actualStart, setActualStart] = useState('')
  const [actualEnd, setActualEnd] = useState('')
  const [timeOptions, setTimeOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const pendingHoldCount = useMemo(() => bookings.filter((booking) => booking.status === 'on-hold').length, [bookings])

  const openBooking = useCallback(async (booking) => {
    const fallbackEnd = addHour(booking.preferredTime)
    setSelected(booking)
    setStatus(booking.status)
    setNotes(booking.adminNotes || '')
    setActualDate(booking.preferredDate)
    setActualStart(booking.preferredTime)
    setActualEnd(fallbackEnd)
    setTimeOptions([booking.preferredTime, fallbackEnd])

    try {
      const data = await scheduleApi.getByDate(booking.preferredDate)
      const boundaries = getBoundaries(data.schedule)
      setTimeOptions(boundaries)
      setActualEnd(getNextBoundary(boundaries, booking.preferredTime))
    } catch (nextError) {
      setError(nextError)
    }
  }, [])

  const loadBookings = async (nextFilters = filters) => {
    setLoading(true)
    setError(null)
    const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value !== ''))

    try {
      const data = await bookingApi.list(params)
      setBookings(data.bookings || [])
      setPagination(data.pagination || null)
    } catch (nextError) {
      setError(nextError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const params = Object.fromEntries(Object.entries(initialFilters).filter(([, value]) => value !== ''))
    bookingApi.list(params)
      .then((data) => {
        if (!active) return
        setBookings(data.bookings || [])
        setPagination(data.pagination || null)
        if (bookingId) {
          bookingApi.getById(bookingId).then((detail) => {
            if (active && detail.booking) openBooking(detail.booking)
          })
        }
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
  }, [bookingId, openBooking])

  const applyFilters = () => {
    const nextFilters = { ...filters, page: 1 }
    setFilters(nextFilters)
    loadBookings(nextFilters)
  }

  const goToPage = (page) => {
    const nextFilters = { ...filters, page }
    setFilters(nextFilters)
    loadBookings(nextFilters)
  }

  const changeActualDate = async (date) => {
    setActualDate(date)
    try {
      const data = await scheduleApi.getByDate(date)
      const boundaries = getBoundaries(data.schedule)
      setTimeOptions(boundaries)
      if (!boundaries.includes(actualStart)) {
        const nextStart = boundaries[0] || actualStart
        setActualStart(nextStart)
        setActualEnd(getNextBoundary(boundaries, nextStart))
      } else {
        setActualEnd(getNextBoundary(boundaries, actualStart))
      }
    } catch (nextError) {
      setError(nextError)
    }
  }

  const saveBooking = async (nextStatus = status) => {
    setSaving(true)
    try {
      const data = nextStatus === 'confirmed'
        ? await bookingApi.confirm(selected._id, {
          date: actualDate,
          startTime: actualStart,
          endTime: actualEnd,
          adminNotes: notes,
        })
        : await bookingApi.updateStatus(selected._id, { status: nextStatus, adminNotes: notes })
      setSelected(null)
      setBookings((current) => current.map((item) => (item._id === data.booking._id ? data.booking : item)))
    } catch (nextError) {
      setError(nextError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5 p-5 lg:p-8">
      <div className="grid gap-3 border border-ink/10 bg-white/55 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <select className="field-input text-xl" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {['pending', 'confirmed', 'on-hold', 'completed', 'cancelled'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <input className="field-input text-xl" type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value, page: 1 }))} />
        <input className="field-input text-xl" placeholder="Email" value={filters.email} onChange={(event) => setFilters((current) => ({ ...current, email: event.target.value, page: 1 }))} />
        <Button onClick={applyFilters}>Filter</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-[#a66a18]/30 bg-[#d49a38]/15 p-4">
        <div>
          <p className="font-body text-[0.68rem] uppercase tracking-[0.16em] text-[#7a5410]">Pending holds</p>
          <p className="mt-1 font-body text-3xl leading-none text-ink">{pendingHoldCount} on this page</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            const nextFilters = { ...filters, status: 'on-hold', page: 1 }
            setFilters(nextFilters)
            loadBookings(nextFilters)
          }}
        >
          Show Holds
        </Button>
      </div>

      {error && <div className="border border-red bg-red/10 p-4 font-body text-xs uppercase tracking-[0.14em] text-red">{error.message}</div>}
      {loading ? <Loader label="Loading bookings" /> : <BookingTable bookings={bookings} onSelect={openBooking} />}

      {pagination && (
        <div className="flex items-center justify-between gap-3 font-body text-xs uppercase tracking-[0.14em] text-ash">
          <span>Page {pagination.page} of {pagination.pages || 1}</span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={filters.page <= 1} onClick={() => goToPage(filters.page - 1)}>Prev</Button>
            <Button variant="ghost" disabled={filters.page >= pagination.pages} onClick={() => goToPage(filters.page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <BookingDetailModal
        booking={selected}
        status={status}
        notes={notes}
        actualDate={actualDate}
        actualStart={actualStart}
        actualEnd={actualEnd}
        timeOptions={timeOptions}
        saving={saving}
        onClose={() => setSelected(null)}
        onStatusChange={setStatus}
        onNotesChange={setNotes}
        onActualDateChange={changeActualDate}
        onActualStartChange={(time) => {
          setActualStart(time)
          setActualEnd(getNextBoundary(timeOptions, time))
        }}
        onActualEndChange={setActualEnd}
        onSave={saveBooking}
        onQuickStatus={saveBooking}
      />
    </section>
  )
}
