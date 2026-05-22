import { useEffect, useState } from 'react'
import { BookingCalendar } from '../components/booking/BookingCalendar'
import { BookingForm } from '../components/booking/BookingForm'
import { BookingConfirmation } from '../components/booking/BookingConfirmation'
import { Loader } from '../components/ui/Loader'
import { useBooking } from '../hooks/useBooking'
import { toDateKey } from '../utils/date'

export default function BookingPage() {
  const bookingApi = useBooking()
  const { loadDate } = bookingApi
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    loadDate(selectedDate)
  }, [loadDate, selectedDate])

  const handleSubmit = async (form) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await bookingApi.submitBooking({
        ...form,
        notes: [form.source ? `Source: ${form.source}` : '', form.notes || ''].filter(Boolean).join('\n'),
        preferredDate: toDateKey(selectedDate),
        preferredTime: selectedSlot,
      })
      setBooking(result)
      await bookingApi.loadDate(selectedDate)
      await bookingApi.refreshRange()
    } catch (error) {
      setSubmitError(error)
    } finally {
      setSubmitting(false)
    }
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
        {bookingApi.loading ? (
          <Loader label="Loading calendar" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <BookingCalendar
              availabilityByDate={bookingApi.availabilityByDate}
              dayAvailability={bookingApi.selectedDateAvailability}
              unavailableDates={bookingApi.unavailableDates}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              loading={bookingApi.dateLoading}
              onDateChange={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              onSlotChange={setSelectedSlot}
            />
            {booking ? (
              <BookingConfirmation booking={booking} onAnother={reset} />
            ) : (
              <div>
                {submitError && (
                  <div className="mb-4 border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">
                    {submitError.message}
                  </div>
                )}
                <BookingForm selectedDate={selectedDate} selectedSlot={selectedSlot} onSubmit={handleSubmit} submitting={submitting} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
