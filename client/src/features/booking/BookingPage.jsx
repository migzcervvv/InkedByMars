import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookingCalendar } from '../../components/booking/BookingCalendar'
import { BookingForm } from '../../components/booking/BookingForm'
import { BookingConfirmation } from '../../components/booking/BookingConfirmation'
import { PageIntro } from '../../components/ui/PageIntro'
import { seoPages } from '../../config/seo.js'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useBookingFlow } from './useBookingFlow'
import { toDateKey } from '../../utils/date'

export default function BookingPage() {
  const flow = useBookingFlow()
  const [params] = useSearchParams()
  const [changingTime, setChangingTime] = useState(false)
  const [intro, setIntro] = useState(false)
  const dialog = useRef(null)
  useEffect(() => {
    if (!intro) return
    const element = dialog.current
    element.showModal()
    const timer = window.setTimeout(() => setIntro(false), 950)
    return () => { window.clearTimeout(timer); element.close() }
  }, [intro])
  const showIdea = Boolean(flow.time) && !changingTime && !intro
  const step = flow.receipt ? 'receipt' : showIdea ? 'idea' : 'time'
  const previousStep = useRef(step)
  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    const heading = document.getElementById({
      time: 'availability-heading',
      idea: 'booking-form-heading',
      receipt: 'receipt-heading',
    }[step])
    heading?.focus({ preventScroll: true })
    const screen = heading?.closest('.booking-screen') ?? heading
    screen?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [step])
  function selectTime(time) {
    setIntro(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !changingTime)
    flow.chooseTime(time)
    setChangingTime(false)
  }
  usePageMeta(seoPages['/booking'].title, seoPages['/booking'].description, { canonicalPath: '/booking' })

  return <div className="booking-page">
    {flow.receipt
      ? <PageIntro title="Your idea is in." aside={<p>BF Resort, Las Piñas<br />All times in Philippine time</p>}><p>Your request has reached the studio. Here’s what happens next.</p></PageIntro>
      : <h1 className="frame booking-title">Request a tattoo session</h1>}
    {intro && <dialog className="booking-interlude" ref={dialog} aria-labelledby="booking-interlude-title" onCancel={() => setIntro(false)}>
      <h2 id="booking-interlude-title">Tell me your idea</h2>
      <button type="button" onClick={() => setIntro(false)}>Skip</button>
    </dialog>}
    {flow.receipt ? <BookingConfirmation booking={flow.receipt} onAnother={flow.startAnother} /> : <div className="frame booking-layout booking-sequence">
      <div className="booking-screen" hidden={showIdea}>
      <BookingCalendar earliestDate={flow.earliestDate} studioDate={flow.studioDate} availabilityByDate={flow.availabilityByDate} dayAvailability={flow.selectedDay} calendarMonth={flow.month} selectedDate={flow.date} selectedSlot={flow.time} loading={flow.dateLoading} rangeLoading={flow.loading} rangeError={flow.rangeError} dateError={flow.dateError} onDateChange={flow.chooseDate} onMonthChange={flow.changeMonth} onSlotChange={selectTime} onRetryRange={() => flow.refreshRange()} onRetryDate={() => flow.fetchDate(toDateKey(flow.date))} />
        {flow.submitError && !flow.time && <p role="alert">{flow.submitError.message}</p>}
      </div>
      <div className="booking-screen" hidden={!showIdea}>
        <button type="button" className="booking-change-time text-button" disabled={flow.submitting} onClick={() => setChangingTime(true)}>← Change time</button>
      <BookingForm key={flow.draftVersion} initialCategory={params.get('style')} selectedDate={flow.date} selectedSlot={flow.time} timeAvailable={flow.timeAvailable} onSubmit={flow.submit} submitting={flow.submitting} submitError={flow.submitError} />
      </div>
    </div>}
  </div>
}
