import { useState } from 'react'
import { BookingCalendar } from '../components/booking/BookingCalendar'
import { BookingForm } from '../components/booking/BookingForm'
import { BookingConfirmation } from '../components/booking/BookingConfirmation'
import { Loader } from '../components/ui/Loader'
import { useBooking } from '../hooks/useBooking'

function localKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function BookingPage() {
  const { appointments, unavailableDates, loading, submitBooking } = useBooking()
  const [selectedDate, setSelectedDate] = useState(new Date('2026-05-11T00:00:00'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState(null)

  const handleSubmit = async (form) => {
    setSubmitting(true)
    const result = await submitBooking({
      ...form,
      date: localKey(selectedDate),
      time: selectedSlot,
      artist: 'InkedByMars',
    })
    setBooking(result)
    setSubmitting(false)
  }

  const reset = () => {
    setBooking(null)
    setSelectedSlot(null)
  }

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Appointments</p>
        <h1 className="page-title">Book Ink</h1>
        {loading ? (
          <Loader label="Loading calendar" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <BookingCalendar
              appointments={appointments}
              unavailableDates={unavailableDates}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onDateChange={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              onSlotChange={setSelectedSlot}
            />
            {booking ? (
              <BookingConfirmation booking={booking} onAnother={reset} />
            ) : (
              <BookingForm selectedDate={selectedDate} selectedSlot={selectedSlot} onSubmit={handleSubmit} submitting={submitting} />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
