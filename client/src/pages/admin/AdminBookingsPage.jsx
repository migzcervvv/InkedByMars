import { useEffect, useState } from 'react'
import { bookingApi } from '../../api/bookingApi'
import { BookingTable } from '../../components/admin/BookingTable'
import { BookingDetailModal } from '../../components/admin/BookingDetailModal'
import { Button } from '../../components/ui/Button'
import { Loader } from '../../components/ui/Loader'

const initialFilters = { status: '', date: '', email: '', page: 1, limit: 20 }

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [bookings, setBookings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

  const openBooking = (booking) => {
    setSelected(booking)
    setStatus(booking.status)
    setNotes(booking.adminNotes || '')
  }

  const saveBooking = async () => {
    setSaving(true)
    try {
      const data = await bookingApi.updateStatus(selected._id, { status, adminNotes: notes })
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

      {error && <div className="border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">{error.message}</div>}
      {loading ? <Loader label="Loading bookings" /> : <BookingTable bookings={bookings} onSelect={openBooking} />}

      {pagination && (
        <div className="flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.14em] text-ash">
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
        saving={saving}
        onClose={() => setSelected(null)}
        onStatusChange={setStatus}
        onNotesChange={setNotes}
        onSave={saveBooking}
      />
    </section>
  )
}
