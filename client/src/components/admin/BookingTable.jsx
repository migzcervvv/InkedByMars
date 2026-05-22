import { Eye } from 'lucide-react'
import { BookingStatusBadge } from './BookingStatusBadge'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'

export function BookingTable({ bookings, onSelect }) {
  if (!bookings.length) {
    return (
      <div className="border border-ink/10 bg-white/45 p-8 text-center font-mono text-xs uppercase tracking-[0.16em] text-ash">
        No bookings match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-ink/10 bg-white/55">
      <table className="min-w-full border-collapse text-left">
        <thead className="border-b border-ink/10 bg-ink/5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ash">
          <tr>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Tattoo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {bookings.map((booking) => (
            <tr key={booking._id} className="transition hover:bg-red/5">
              <td className="px-4 py-4">
                <p className="font-body text-2xl leading-none text-ink">{booking.clientName}</p>
                <p className="mt-1 font-mono text-[0.68rem] text-ash">{booking.email}</p>
              </td>
              <td className="px-4 py-4 font-mono text-xs uppercase tracking-[0.1em]">
                {formatDisplayDate(booking.preferredDate)}
                <br />
                <span className="text-ash">{formatDisplayTime(booking.preferredTime)}</span>
              </td>
              <td className="max-w-xs px-4 py-4 font-body text-xl leading-tight text-ash">{booking.tattooIdea}</td>
              <td className="px-4 py-4"><BookingStatusBadge status={booking.status} /></td>
              <td className="px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(booking)}
                  className="inline-grid size-10 place-items-center border border-ink/15 text-ink transition hover:border-red hover:text-red"
                  aria-label={`Open ${booking.clientName}`}
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

