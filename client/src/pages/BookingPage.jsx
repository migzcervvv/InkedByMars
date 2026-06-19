import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingCalendar } from '../components/booking/BookingCalendar'
import { BookingForm } from '../components/booking/BookingForm'
import { useBooking } from '../hooks/useBooking'
import { endOfMonth, startOfMonth, toDateKey } from '../utils/date'

export default function BookingPage() {
  const bookingApi = useBooking()
  const navigate = useNavigate()
  const { loadDate, refreshRange, setRange } = bookingApi
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    setRange({
      startDate: toDateKey(startOfMonth(calendarMonth)),
      endDate: toDateKey(endOfMonth(calendarMonth)),
    })
  }, [calendarMonth, setRange])

  useEffect(() => {
    loadDate(selectedDate)
  }, [loadDate, selectedDate])

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setCalendarMonth(startOfMonth(date))
    setSelectedSlot(null)
    setSubmitError(null)
  }

  const handleSlotChange = (time) => {
    if (time === selectedSlot) return
    setSubmitError(null)
    setSelectedSlot(time)
  }

  const handleSubmit = async (form) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { references, source, ...bookingFields } = form
      const result = await bookingApi.submitBooking({
        ...bookingFields,
        referenceImages: references.map((reference) => ({
          url: reference.dataUrl,
          publicId: reference.name,
        })),
        notes: [source ? `Source: ${source}` : '', form.notes || ''].filter(Boolean).join('\n'),
        preferredDate: toDateKey(selectedDate),
        preferredTime: selectedSlot,
      })
      await loadDate(selectedDate)
      await refreshRange()
      navigate('/booking/confirmation', { state: { booking: result } })
    } catch (error) {
      setSubmitError(error)
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32 lg:pb-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Appointments</p>
        <h1 className="page-title">Book Now</h1>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            {bookingApi.error && (
              <div className="mb-4 border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">
                {bookingApi.error.message || "Can't reach the server. Check your connection or try again in a moment."}
              </div>
            )}
            <BookingCalendar
              availabilityByDate={bookingApi.availabilityByDate}
              dayAvailability={bookingApi.selectedDateAvailability}
              blockedDates={bookingApi.blockedDates}
              bookedDates={bookingApi.bookedDates}
              calendarMonth={calendarMonth}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              loading={bookingApi.dateLoading}
              rangeLoading={bookingApi.loading}
              onDateChange={handleDateChange}
              onMonthChange={setCalendarMonth}
              onSlotChange={handleSlotChange}
            />
          </div>
          <div>
            {submitError && (
              <div className="mb-4 border border-red bg-red/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-red">
                {submitError.message || "Can't reach the server. Check your connection or try again in a moment."}
              </div>
            )}
            <BookingForm
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
