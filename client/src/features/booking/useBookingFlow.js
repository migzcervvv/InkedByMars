import { useCallback, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAvailability } from '../../hooks/useAvailability'
import { submitBooking } from '../../services/bookingService'
import { endOfMonth, fromDateKey, startOfMonth, studioTodayKey, toDateKey } from '../../utils/date'
import { buildBookingPayload } from './bookingModel'

export function useBookingFlow() {
  const { state } = useLocation()
  const today = fromDateKey(studioTodayKey())
  const [month, setMonth] = useState(() => startOfMonth(today))
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  const [receipt, setReceipt] = useState(() => state?.booking || null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [draftVersion, setDraftVersion] = useState(0)
  const submittingRef = useRef(false)
  const availability = useAvailability(startOfMonth(today), endOfMonth(today))
  const { setRange, fetchDate, refreshRange } = availability

  const changeMonth = useCallback(next => {
    if (submittingRef.current) return
    setMonth(startOfMonth(next))
    setRange({ startDate: toDateKey(startOfMonth(next)), endDate: toDateKey(endOfMonth(next)) })
    setDate(null); setTime(null); setSubmitError(null)
  }, [setRange])

  const chooseDate = useCallback(next => {
    if (submittingRef.current) return
    setDate(next); setTime(null); setSubmitError(null)
    fetchDate(toDateKey(next))
  }, [fetchDate])

  const chooseTime = next => { if (!submittingRef.current) { setTime(next); setSubmitError(null) } }
  const selectedDay = availability.selectedDateAvailability?.date === toDateKey(date) ? availability.selectedDateAvailability : null
  const timeAvailable = !availability.loading && !availability.dateLoading && !availability.rangeError && !availability.dateError && selectedDay?.slots?.some(slot => slot.time === time && slot.available && slot.status === 'available')

  const submit = async draft => {
    if (submittingRef.current) return
    if (!date || !timeAvailable) { setSubmitError({ message: 'Choose an available date and time before sending your request.' }); return }
    submittingRef.current = true
    setSubmitting(true); setSubmitError(null)
    try {
      const booking = await submitBooking(buildBookingPayload(draft, toDateKey(date), time))
      if (!booking) throw new Error('The server did not return a booking receipt. Please check with the studio before trying again.')
      setReceipt(booking)
    } catch (error) {
      setSubmitError(error)
      if (error.status === 409) { setTime(null); await Promise.all([fetchDate(toDateKey(date)), refreshRange()]) }
      return { error }
    } finally { submittingRef.current = false; setSubmitting(false) }
  }

  const startAnother = () => {
    setReceipt(null); setTime(null); setDate(null); setSubmitError(null); setDraftVersion(value => value + 1); refreshRange()
  }

  return { ...availability, month, date, time, selectedDay, timeAvailable, receipt, submitting, submitError, draftVersion, changeMonth, chooseDate, chooseTime, submit, startAnother }
}
