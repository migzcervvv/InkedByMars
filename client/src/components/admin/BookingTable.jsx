import { Eye } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatDisplayDate, formatDisplayTime } from "../../utils/date";

export function BookingTable({ bookings, onSelect }) {
  if (!bookings.length) {
    return (
      <div className="border border-ink/10 bg-white/45 p-8 text-center font-body text-xs uppercase tracking-[0.16em] text-ash">
        No bookings match these filters.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((booking) => (
            <article
              key={booking._id}
              className="border border-ink/10 bg-white/65 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-2xl leading-none text-ink">
                    {booking.clientName}
                  </p>
                  <p className="mt-1 break-all font-body text-[0.68rem] text-ash">
                    {booking.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(booking)}
                  className="grid size-11 shrink-0 place-items-center border border-ink/15 text-ink transition hover:border-red hover:text-red"
                  aria-label={`Open ${booking.clientName}`}
                >
                  <Eye size={16} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <BookingStatusBadge status={booking.status} />
                <span className="font-body text-[0.68rem] uppercase tracking-[0.1em] text-ash">
                  {formatDisplayDate(booking.preferredDate)} at{" "}
                  {formatDisplayTime(booking.preferredTime)}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 font-body text-xl leading-tight text-ash">
                {booking.instagramHandle}
              </p>
            </article>
          ))}
      </div>

      <div className="hidden overflow-x-auto border border-ink/10 bg-white/55 md:block">
        <table className="min-w-full border-collapse text-left" data-ui>
          <thead className="border-b border-ink/10 bg-ink/5 font-body text-[0.68rem] uppercase tracking-[0.14em] text-ash"> {/* taste-skill-ignore: real administrative table header rule */}
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">IG Handle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10"> {/* taste-skill-ignore: real administrative table row rules */}
            {bookings.map((booking) => (
              <tr key={booking._id} className="transition hover:bg-red/5">
                <td className="px-4 py-4">
                  <p className="font-body text-2xl leading-none text-ink">
                    {booking.clientName}
                  </p>
                  <p className="mt-1 font-body text-[0.68rem] text-ash">
                    {booking.email}
                  </p>
                </td>
                <td className="px-4 py-4 font-body text-xs uppercase tracking-[0.1em]">
                  {formatDisplayDate(booking.preferredDate)}
                  <br />
                  <span className="text-ash">
                    {formatDisplayTime(booking.preferredTime)}
                  </span>
                </td>
                <td className="max-w-xs px-4 py-4 font-body text-md leading-tight text-ash">
                  {booking.instagramHandle}
                </td>
                <td className="px-4 py-4">
                  <BookingStatusBadge status={booking.status} />
                </td>
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
    </>
  );
}
