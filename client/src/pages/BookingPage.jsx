import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingCalendar } from '../components/booking/BookingCalendar'
import { BookingForm } from '../components/booking/BookingForm'
import { useBooking } from '../hooks/useBooking'
import { endOfMonth, startOfMonth, toDateKey } from '../utils/date'

export default function BookingPage() {
  const bookingApi = useBooking()
  const navigate = useNavigate()
  const { holdSlot, loadDate, refreshRange, releaseHold, setRange } = bookingApi
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [hold, setHold] = useState(null)
  const [holdLoading, setHoldLoading] = useState('')
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

  const releaseHoldValue = async (holdValue) => {
    if (!holdValue?.holdToken) return
    await releaseHold({
      date: holdValue.date,
      time: holdValue.time,
      holdToken: holdValue.holdToken,
    })
  }

  const releaseCurrentHold = () => releaseHoldValue(hold)

  const handleDateChange = (date) => {
    const previousHold = hold

    setSelectedDate(date)
    setCalendarMonth(startOfMonth(date))
    setSelectedSlot(null)
    setHold(null)
    setSubmitError(null)

    void releaseHoldValue(previousHold)
  }

  const handleSlotChange = async (time) => {
    if (time === selectedSlot || holdLoading) return

    setHoldLoading(time)
    setSubmitError(null)

    try {
      await releaseCurrentHold()
      const nextHold = await holdSlot({
        date: toDateKey(selectedDate),
        time,
      })
      setSelectedSlot(time)
      setHold(nextHold)
      await loadDate(selectedDate)
      await refreshRange()
    } catch (error) {
      setSelectedSlot(null)
      setHold(null)
      setSubmitError(error)
      await loadDate(selectedDate)
    } finally {
      setHoldLoading('')
    }
  }

  const handleSubmit = async (form) => {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const { references, source, ...bookingFields } = form
      const result = await bookingApi.submitBooking({
        ...bookingFields,
        holdToken: hold?.holdToken,
        referenceImages: references.map((reference) => ({
          url: reference.dataUrl,
          publicId: reference.name,
        })),
        notes: [source ? `Source: ${source}` : '', form.notes || ''].filter(Boolean).join('\n'),
        preferredDate: toDateKey(selectedDate),
        preferredTime: selectedSlot,
      })
      setHold(null)
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
              holdLoading={holdLoading}
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
              hold={hold}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
