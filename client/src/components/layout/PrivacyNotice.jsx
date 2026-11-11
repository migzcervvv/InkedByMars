import { Dialog } from '../ui/Dialog'
import { studio } from '../../config/studio'
export function PrivacyNotice({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Your privacy">
      <div className="reading-copy">
        <p>The booking form collects your name, email, phone number, Instagram handle, tattoo details, preferred appointment, and reference images. The studio uses these to review your request, arrange your appointment, and communicate with you.</p>
        <h3>Booking information</h3>
        <p>Your request is sent to the studio’s server. Access to booking records is restricted to authenticated studio administrators. Booking notifications may include request details and links to reference images.</p>
        <p>Reference images attached to a booking are scheduled for deletion 14 days after the appointment start, using Philippine time. If the appointment changes, the new schedule applies. If the request is cancelled or never confirmed, the last date and time on the request apply.</p>
        <h3>Instagram</h3>
        <p>The Works page displays media supplied through Instagram. Loading those images or following an Instagram link may connect your browser to Meta services.</p>
        <h3>Contact</h3>
        <p>Contact <a href={`mailto:${studio.email}`}>{studio.email}</a> for questions about your booking information, or to request access, correction, or deletion.</p>
      </div>
    </Dialog>
  )
}
