import { Button } from '../../components/ui/Button'
import { studio } from '../../config/studio'
import { BookingCalendar } from '../../components/booking/BookingCalendar'
import { seoPages } from '../../config/seo'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useBookingFlow } from './useBookingFlow'
import { toDateKey } from '../../utils/date'

export default function BookingPage() {
  const flow = useBookingFlow()
  usePageMeta(seoPages['/booking'].title, seoPages['/booking'].description, { canonicalPath: '/booking' })

  return <div className="booking-page">
    <div className="frame booking-layout booking-sequence">
      <div className="booking-screen">
        <BookingCalendar earliestDate={flow.earliestDate} studioDate={flow.studioDate} availabilityByDate={flow.availabilityByDate} dayAvailability={flow.selectedDay} calendarMonth={flow.month} selectedDate={flow.date} loading={flow.dateLoading} rangeLoading={flow.loading} rangeError={flow.rangeError} dateError={flow.dateError} onDateChange={flow.chooseDate} onMonthChange={flow.changeMonth} onRetryRange={() => flow.refreshRange()} onRetryDate={() => flow.fetchDate(toDateKey(flow.date))} />
      </div>
    </div>
    <section className="booking-invitation" aria-labelledby="booking-invitation-heading">
        <img src="/studio-portrait.webp" alt="Mars, tattoo artist" loading="lazy" />
        <div className="booking-invitation-copy">
          <h2 id="booking-invitation-heading">Let’s talk about your tattoo.</h2>
          <p>DM Mars your preferred time and tattoo idea to book.</p>
          <Button href={studio.instagram}>Send Mars your idea</Button>
        </div>
    </section>
  </div>
}
