import { Check } from 'lucide-react'
import { studio } from '../../config/studio'
import { formatDisplayDate, formatDisplayTime } from '../../utils/date'
import { Button } from '../ui/Button'

export function BookingConfirmation({ booking, onAnother }) {
  const confirmed = booking.status === 'confirmed'
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(booking.preferredDate || '')
  const validTime = /^\d{2}:\d{2}$/.test(booking.preferredTime || '')
  return <section className="frame receipt-section" aria-labelledby="receipt-heading"><div className="receipt-mark"><Check size={34} aria-hidden="true" /></div><div><h2 id="receipt-heading">{confirmed ? 'Your session is confirmed.' : 'Request received.'}</h2><p>{confirmed ? 'Your appointment has been confirmed by the studio.' : 'Mars will review your idea and get in touch using the details you provided. Your selected time is a request, not a confirmed appointment.'}</p><dl className="receipt-details"><div><dt>Requested session</dt><dd>{validDate ? formatDisplayDate(booking.preferredDate) : 'Check your request details'}{validTime && ` at ${formatDisplayTime(booking.preferredTime)}`}<br />Philippine time</dd></div><div><dt>Studio</dt><dd>{studio.location}</dd></div><div><dt>Status</dt><dd>{confirmed ? 'Confirmed' : 'Awaiting studio review'}</dd></div></dl><p>Keep the studio’s reply for your appointment details. You can contact <a href={studio.instagram} target="_blank" rel="noreferrer">{studio.instagramHandle}</a> with any questions.</p><div className="receipt-actions"><Button to="/works">Explore the works</Button><Button variant="ghost" onClick={onAnother}>Start another request</Button></div></div></section>
}
