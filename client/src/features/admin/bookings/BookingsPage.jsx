import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { bookingApi } from '../../../api/bookingApi'
import { BookingStatusBadge } from '../../../components/admin/BookingStatusBadge'
import { formatDisplayDate, formatDisplayTime, formatStudioTimestamp } from '../../../utils/date'
import { AdminFeedback } from '../AdminFeedback'
import { useAdminResource } from '../useAdminResource'
import { BookingReview } from './BookingReview'

const views = [
  ['review', 'Needs review'], ['confirmed', 'Confirmed'], ['completed', 'Completed'],
  ['cancelled', 'Cancelled / declined'], ['all', 'All'],
]
const loadQueue = key => bookingApi.list(Object.fromEntries(new URLSearchParams(key)))
const loadBooking = id => bookingApi.getById(id)

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const backTo = useRef(null)
  const detailTitle = useRef(null)
  const previousSelection = useRef(null)
  const bookingId = params.get('booking')
  const view = views.some(([key]) => key === params.get('view')) ? params.get('view') : 'review'
  const date = params.get('date') || ''
  const page = params.get('page') || '1'
  const queue = useAdminResource(new URLSearchParams({ view, search, date, page }).toString(), loadQueue)
  const detail = useAdminResource(bookingId, loadBooking)
  const reloadQueue = queue.reload
  const reloadDetail = detail.reload
  const bookings = queue.data?.bookings || []
  const counts = queue.data?.counts

  useEffect(() => {
    const timer = window.setInterval(() => {
      reloadQueue()
      if (bookingId) reloadDetail()
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [reloadQueue, reloadDetail, bookingId])

  useEffect(() => {
    if (bookingId && previousSelection.current !== bookingId) {
      detailTitle.current?.focus({ preventScroll: true })
      if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo(0, 0)
    } else if (!bookingId && previousSelection.current && backTo.current) {
      const { element, scroll } = backTo.current
      element?.focus({ preventScroll: true })
      if (window.matchMedia('(max-width: 767px)').matches) window.scrollTo(0, scroll)
    }
    previousSelection.current = bookingId
  }, [bookingId])

  const changeParams = (updates, replace = false) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace })
  }

  const select = (event, id) => {
    backTo.current = { element: event.currentTarget, scroll: window.scrollY }
    setFeedback('')
    changeParams({ booking: id })
  }

  const refresh = () => { queue.reload(); detail.reload() }

  return <div className="studio-screen">
    <header className="studio-screen-heading"><h1>Bookings</h1><p>All times in Philippine time</p></header>
    {feedback && <p className="studio-result" role="status">{feedback}</p>}
    <div className={`studio-booking-workspace ${bookingId ? 'studio-detail-active' : ''}`}>
      <section className="studio-queue studio-panel" aria-label="Booking queue">
        <nav className="studio-filters" aria-label="Booking filters">
          {views.map(([key, label]) => <button type="button" key={key} aria-pressed={view === key} onClick={() => changeParams({ view: key, page: null, booking: null })}>
            {label}{counts && <span>{counts[key]}</span>}
          </button>)}
        </nav>
        <details className="studio-search">
          <summary><Search size={16} aria-hidden="true" /> Search and date {search || date ? '· Active' : ''}</summary>
          <form key={`${search}|${date}`} className="studio-fields" onSubmit={event => {
            event.preventDefault()
            const fields = new FormData(event.currentTarget)
            setSearch(fields.get('search').trim())
            changeParams({ date: fields.get('date'), page: null, booking: null })
          }}>
            <label>Client name or email<input type="search" name="search" maxLength={100} defaultValue={search} /></label>
            <label>Appointment date<input type="date" name="date" defaultValue={date} /></label>
            <div className="studio-actions"><button type="submit" className="studio-primary">Search</button>
              {(search || date) && <button type="button" className="studio-plain" onClick={() => { setSearch(''); changeParams({ date: null, page: null, booking: null }) }}>Clear</button>}
            </div>
          </form>
        </details>
        <AdminFeedback error={queue.error} onRetry={queue.reload} />
        <div aria-busy={queue.loading}>
          {queue.loading && !queue.data && <p className="studio-panel-message" role="status">Loading bookings…</p>}
          {!queue.loading && queue.data && !bookings.length && <p className="studio-panel-message">No bookings match this view.</p>}
          {bookings.length > 0 && <ul className="studio-queue-list">
            {bookings.map(booking => <li key={booking._id}><button type="button" aria-pressed={bookingId === booking._id} onClick={event => select(event, booking._id)}>
              <span className="studio-queue-client"><strong>{booking.clientName}</strong><span>{formatDisplayDate(booking.preferredDate)} · {formatDisplayTime(booking.preferredTime)}</span></span>
              <span className="studio-queue-status"><BookingStatusBadge status={booking.isExpired ? 'expired' : booking.status} />
                {booking.holdExpiresAt && booking.status === 'on-hold' && !booking.isExpired && <span>Expires {formatStudioTimestamp(booking.holdExpiresAt)}</span>}
                <span>Sent {formatStudioTimestamp(booking.createdAt)}</span></span>
              <ChevronRight size={16} aria-hidden="true" />
            </button></li>)}
          </ul>}
        </div>
        {queue.data?.pagination && (Number(page) > 1 || queue.data.pagination.pages > 1) && <div className="studio-pagination">
          <button type="button" disabled={Number(page) <= 1} onClick={() => changeParams({ page: Number(page) - 1 })}>Previous</button>
          <span>{queue.data.pagination.pages ? `${page} of ${queue.data.pagination.pages}` : 'No results'}</span>
          <button type="button" disabled={Number(page) >= queue.data.pagination.pages} onClick={() => changeParams({ page: Number(page) + 1 })}>Next</button>
        </div>}
      </section>
      <section className="studio-detail studio-panel" aria-labelledby="studio-detail-heading">
        {bookingId && <button type="button" className="studio-plain studio-back" onClick={() => changeParams({ booking: null }, true)}>Back to bookings</button>}
        <div className="studio-detail-header">
          <h2 ref={detailTitle} tabIndex={-1} id="studio-detail-heading">{detail.data?.booking?.clientName || 'Booking details'}</h2>
          {detail.data?.booking && <BookingStatusBadge status={detail.data.booking.isExpired ? 'expired' : detail.data.booking.status} />}
        </div>
        {!bookingId && <p className="studio-detail-empty">Select a booking to review the request and appointment.</p>}
        {detail.loading && !detail.data && <p role="status">Loading booking…</p>}
        <AdminFeedback error={detail.error} onRetry={detail.reload} />
        {detail.data?.booking && <BookingReview key={bookingId} booking={detail.data.booking} refreshing={detail.loading || Boolean(detail.error)} onRefresh={refresh} onSaved={message => {
          setFeedback(message)
          refresh()
          requestAnimationFrame(() => detailTitle.current?.focus({ preventScroll: true }))
        }} />}
      </section>
    </div>
  </div>
}
