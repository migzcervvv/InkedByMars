import { useCallback, useEffect, useState } from 'react'
import { useAvailability } from '../../hooks/useAvailability'
import { addDays, endOfMonth, fromDateKey, startOfMonth, studioTodayKey, toDateKey } from '../../utils/date'

export function useBookingFlow() {
  const [studioDate, setStudioDate] = useState(studioTodayKey)
  const tomorrow = addDays(fromDateKey(studioDate), 1)
  const [month, setMonth] = useState(() => startOfMonth(tomorrow))
  const [chosenDate, setDate] = useState(null)
  const availability = useAvailability(startOfMonth(tomorrow), endOfMonth(tomorrow))
  const { setRange, fetchDate, refreshRange } = availability
  const earliestDate = [toDateKey(tomorrow), availability.policy?.earliestBookableDate].sort().filter(Boolean).at(-1)

  const firstOpen = Object.values(availability.availabilityByDate).filter(day => day.date >= earliestDate && day.availableCount > 0 && !day.isBlocked && !day.isFullyClosed && !day.isFullyBooked).map(day => day.date).sort()[0]
  const dateKey = toDateKey(chosenDate) || firstOpen
  const date = dateKey ? fromDateKey(dateKey) : null

  useEffect(() => {
    if (dateKey) fetchDate(dateKey)
  }, [dateKey, fetchDate])

  useEffect(() => {
    const sync = () => {
      const current = studioTodayKey()
      if (current === studioDate) return
      setStudioDate(current)
      refreshRange()
      if (dateKey) fetchDate(dateKey)
    }
    const midnight = Date.parse(`${toDateKey(addDays(fromDateKey(studioDate), 1))}T00:00:00+08:00`)
    const timer = window.setTimeout(sync, Math.max(0, midnight - Date.now() + 100))
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [studioDate, dateKey, fetchDate, refreshRange])

  const changeMonth = useCallback(next => {
    setMonth(startOfMonth(next))
    setRange({ startDate: toDateKey(startOfMonth(next)), endDate: toDateKey(endOfMonth(next)) })
    setDate(null)
  }, [setRange])

  const selectedDay = availability.selectedDateAvailability?.date === toDateKey(date) ? availability.selectedDateAvailability : null
  return { ...availability, month, date, studioDate, earliestDate, selectedDay, changeMonth, chooseDate: setDate }
}
