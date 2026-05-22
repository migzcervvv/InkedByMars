import { motion } from 'framer-motion'
import { Check, CalendarPlus } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatDisplayDate } from '../../utils/date'
import { generateIcs } from '../../utils/animations'

export function BookingConfirmation({ booking, onAnother }) {
  const addToCalendar = () => {
    const ics = generateIcs({
      date: booking.preferredDate,
      time: booking.preferredTime,
      name: booking.clientName,
      style: booking.tattooIdea,
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${booking._id || 'inkedbymars-booking'}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.section
      className="booking-panel flex min-h-[560px] items-center justify-center text-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      <div className="max-w-md">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-red text-cream">
          <Check size={36} />
        </div>
        <h2 className="mt-6 font-display text-6xl italic text-ink">You're booked!</h2>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-red">{booking._id || 'Request received'}</p>
        <p className="mt-6 font-body text-3xl leading-tight text-ash">
          {formatDisplayDate(booking.preferredDate)} at {booking.preferredTime}. InkedByMars will review your notes and references before the session.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={addToCalendar}>
            <CalendarPlus size={16} /> Add to Calendar
          </Button>
          <Button variant="ghost" onClick={onAnother}>Book Another</Button>
        </div>
      </div>
    </motion.section>
  )
}
