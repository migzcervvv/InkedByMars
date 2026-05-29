import { Check, X } from "lucide-react";
import { Button } from "../ui/Button";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { formatDisplayDate, formatDisplayTime } from "../../utils/date";

const statusOptions = [
  "pending",
  "confirmed",
  "on-hold",
  "completed",
  "cancelled",
];

export function BookingDetailModal({
  booking,
  status,
  notes,
  actualDate,
  actualStart,
  actualEnd,
  timeOptions,
  saving,
  onClose,
  onStatusChange,
  onNotesChange,
  onActualDateChange,
  onActualStartChange,
  onActualEndChange,
  onSave,
  onQuickStatus,
}) {
  if (!booking) return null;

  const endOptions = timeOptions.filter((time) => time > actualStart);
  const references = booking.referenceImages || [];

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-ink/50 p-0 sm:place-items-center sm:p-6">
      <section className="max-h-[92vh] w-full overflow-y-auto bg-cream p-5 shadow-leather sm:max-w-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-red">
              Booking detail
            </p>
            <h2 className="mt-2 font-display text-4xl italic leading-none">
              {booking.clientName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center border border-ink/15"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info
            label="When"
            value={`${formatDisplayDate(booking.preferredDate)} at ${formatDisplayTime(booking.preferredTime)}`}
          />
          <Info label="Contact" value={`${booking.email} / ${booking.phone}`} />
          <Info label="Placement" value={booking.tattooPlacement} />
          <Info label="Size" value={booking.tattooSize} />
        </div>

        <div className="mt-5 border border-ink/10 bg-white/45 p-4">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-red">
            Idea
          </p>
          <p className="mt-2 font-body text-2xl leading-tight text-ink">
            {booking.tattooIdea}
          </p>
          {booking.notes && (
            <p className="mt-3 whitespace-pre-wrap font-body text-xl leading-tight text-ash">
              {booking.notes}
            </p>
          )}
        </div>

        {references.length > 0 && (
          <div className="mt-5 border border-ink/10 bg-white/45 p-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-red">
              Reference images
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {references.map((image, index) => (
                <a
                  key={image.publicId || image.url || index}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={image.url}
                    alt={`Reference ${index + 1}`}
                    className="aspect-square w-full border border-ink/15 object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4">
          <label className="field-label">
            Status
            <select
              className="field-input"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 border border-ink/10 bg-white/45 p-4 sm:grid-cols-3">
            <label className="field-label">
              Actual date
              <input
                className="field-input"
                type="date"
                value={actualDate}
                onChange={(event) => onActualDateChange(event.target.value)}
              />
            </label>
            <label className="field-label">
              Actual start
              <select
                className="field-input"
                value={actualStart}
                onChange={(event) => onActualStartChange(event.target.value)}
              >
                {timeOptions.slice(0, -1).map((time) => (
                  <option key={time} value={time}>
                    {formatDisplayTime(time)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Actual end
              <select
                className="field-input"
                value={actualEnd}
                onChange={(event) => onActualEndChange(event.target.value)}
              >
                {endOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatDisplayTime(time)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            Admin notes
            <textarea
              className="field-input min-h-28 resize-none"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <BookingStatusBadge status={booking.status} />
          <div className="flex flex-wrap md:flex-nowrap gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="leather"
              onClick={() => onQuickStatus("cancelled")}
              disabled={saving}
            >
              Reject
            </Button>
            <Button
              onClick={() => onQuickStatus("confirmed")}
              disabled={saving}
            >
              <Check size={16} /> Approve
            </Button>
            <Button onClick={() => onSave()} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border border-ink/10 bg-white/45 p-4">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-red">
        {label}
      </p>
      <p className="mt-2 font-body text-2xl leading-tight text-ink">{value}</p>
    </div>
  );
}
