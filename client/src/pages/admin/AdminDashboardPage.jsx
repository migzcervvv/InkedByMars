import { useEffect, useState } from 'react'
import { CalendarCheck, Clock3, Inbox, ShieldCheck } from 'lucide-react'
import { bookingApi } from '../../api/bookingApi'
import { BookingStatusBadge } from '../../components/admin/BookingStatusBadge'
import { Loader } from '../../components/ui/Loader'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'

const cards = [
  { key: 'total', label: 'Total', icon: Inbox },
  { key: 'pending', label: 'Pending', icon: Clock3 },
  { key: 'confirmed', label: 'Confirmed', icon: CalendarCheck },
  { key: 'completed', label: 'Completed', icon: ShieldCheck },
]

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    bookingApi.dashboard()
      .then((nextData) => {
        if (active) setData(nextData)
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
    <section className="p-5 lg:p-8">
      {loading ? (
        <Loader label="Loading dashboard" />
      ) : error ? (
        <Panel>{error.message}</Panel>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.key} className="border border-ink/10 bg-white/55 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-body text-xs uppercase tracking-[0.16em] text-ash">{card.label}</p>
                    <Icon size={20} className="text-red" />
                  </div>
                  <p className="mt-5 font-display text-5xl italic leading-none">{data.stats?.[card.key] || 0}</p>
                </article>
              )
            })}
          </div>

          <Panel title="Recent bookings">
            <div className="grid gap-3">
              {(data.recentBookings || []).map((booking) => (
                <div key={booking._id} className="flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-cream/60 p-4">
                  <div>
                    <p className="font-body text-2xl leading-none">{booking.clientName}</p>
                    <p className="mt-1 font-body text-[0.68rem] uppercase tracking-[0.12em] text-ash">
                      {formatDisplayDate(booking.preferredDate)} at {formatDisplayTime(booking.preferredTime)}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </section>
  )
}

function Panel({ title, children }) {
  return (
    <section className="border border-ink/10 bg-white/55 p-5">
      {title && <h2 className="font-display text-3xl italic">{title}</h2>}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
