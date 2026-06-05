import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookingCalendar } from '../components/booking/BookingCalendar'
import { BookingForm } from '../components/booking/BookingForm'
import { Loader } from '../components/ui/Loader'
import { useBooking } from '../hooks/useBooking'
import { toDateKey } from '../utils/date'

export default function BookingPage() {
  const bookingApi = useBooking()
  const navigate = useNavigate()
  const { holdSlot, loadDate, refreshRange, releaseHold } = bookingApi
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [hold, setHold] = useState(null)
  const [holdLoading, setHoldLoading] = useState('')
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    loadDate(selectedDate)
  }, [loadDate, selectedDate])

  useEffect(() => {
    if (!hold?.holdExpiresAt) {
      return undefined
    }

    const tick = () => {
      const seconds = Math.max(0, Math.floor((new Date(hold.holdExpiresAt).getTime() - Date.now()) / 1000))
      setHoldSecondsRemaining(seconds)
      if (seconds === 0) {
        setHold(null)
        setSelectedSlot(null)
        setHoldSecondsRemaining(0)
        setSubmitError({ message: 'Temporary hold expired. Select another time.' })
        loadDate(selectedDate)
        refreshRange()
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [hold, loadDate, refreshRange, selectedDate])

  const releaseCurrentHold = async () => {
    if (!hold?.holdToken) return
    await releaseHold({
      date: hold.date,
      time: hold.time,
      holdToken: hold.holdToken,
    })
  }

  const handleDateChange = async (date) => {
    await releaseCurrentHold()
    setSelectedDate(date)
    setSelectedSlot(null)
    setHold(null)
    setHoldSecondsRemaining(0)
    setSubmitError(null)
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
      setHoldSecondsRemaining(0)
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
      setHoldSecondsRemaining(0)
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
        {bookingApi.loading ? (
          <Loader label="Loading calendar" />
        ) : (
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
                unavailableDates={bookingApi.unavailableDates}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                loading={bookingApi.dateLoading}
                holdLoading={holdLoading}
                onDateChange={handleDateChange}
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
                holdSecondsRemaining={holdSecondsRemaining}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
