import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../../components/booking/BookingCalendar'
import { BookingForm } from '../../components/booking/BookingForm'
import { BookingConfirmation } from '../../components/booking/BookingConfirmation'
import { PageIntro } from '../../components/ui/PageIntro'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useBookingFlow } from './useBookingFlow'
import { toDateKey } from '../../utils/date'

export default function BookingPage() {
  const flow = useBookingFlow()
  const [params] = useSearchParams()
  useEffect(() => {
    if (!flow.date || !window.matchMedia('(max-width: 767px)').matches) return undefined
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(flow.time ? 'booking-form-heading' : 'booking-time-step')
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [flow.date, flow.time])
  usePageMeta('Request a session', 'Check availability and request your tattoo session with Mars in BF Resort, Las Piñas. Choose a time, describe your piece, and attach your references in one place.')

  return <div className="booking-page">
    <PageIntro title={flow.receipt ? 'Your idea is in.' : 'Let’s make a mark.'} aside={<p>BF Resort, Las Piñas<br />All times in Philippine time</p>}><p>{flow.receipt ? 'Your request has reached the studio. Here’s what happens next.' : 'Choose a time. Tell me about your piece. We’ll take it from there.'}</p></PageIntro>
    {flow.receipt ? <BookingConfirmation booking={flow.receipt} onAnother={flow.startAnother} /> : <div className="frame booking-layout">
      <BookingCalendar earliestDate={flow.earliestDate} studioDate={flow.studioDate} availabilityByDate={flow.availabilityByDate} dayAvailability={flow.selectedDay} calendarMonth={flow.month} selectedDate={flow.date} selectedSlot={flow.time} loading={flow.dateLoading} rangeLoading={flow.loading} rangeError={flow.rangeError} dateError={flow.dateError} onDateChange={flow.chooseDate} onMonthChange={flow.changeMonth} onSlotChange={flow.chooseTime} onRetryRange={() => flow.refreshRange()} onRetryDate={() => flow.fetchDate(toDateKey(flow.date))} />
      <BookingForm key={flow.draftVersion} initialCategory={params.get('style')} selectedDate={flow.date} selectedSlot={flow.time} timeAvailable={flow.timeAvailable} onSubmit={flow.submit} submitting={flow.submitting} submitError={flow.submitError} />
    </div>}
  </div>
}
