import { BookingCalendar } from '../../components/booking/BookingCalendar'
import { seoPages } from '../../config/seo'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useBookingFlow } from './useBookingFlow'
import { toDateKey } from '../../utils/date'

export default function BookingPage() {
  const flow = useBookingFlow()
  usePageMeta(seoPages['/booking'].title, seoPages['/booking'].description, { canonicalPath: '/booking' })

  return <div className="booking-page">
    <h1 className="frame booking-title">Tattoo availability</h1>
    <div className="frame booking-layout booking-sequence">
      <div className="booking-screen">
        <BookingCalendar earliestDate={flow.earliestDate} studioDate={flow.studioDate} availabilityByDate={flow.availabilityByDate} dayAvailability={flow.selectedDay} calendarMonth={flow.month} selectedDate={flow.date} loading={flow.dateLoading} rangeLoading={flow.loading} rangeError={flow.rangeError} dateError={flow.dateError} onDateChange={flow.chooseDate} onMonthChange={flow.changeMonth} onRetryRange={() => flow.refreshRange()} onRetryDate={() => flow.fetchDate(toDateKey(flow.date))} />
      </div>
    </div>
  </div>
}
