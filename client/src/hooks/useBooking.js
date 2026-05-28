import { useCallback, useMemo, useState } from 'react'
import { createBookingHold, releaseBookingHold, submitBooking } from '../services/bookingService'
import { useAvailability } from './useAvailability'
import { toDateKey } from '../utils/date'

export function useBooking() {
  const availability = useAvailability()
  const { fetchDate } = availability
  const [bookingError, setBookingError] = useState(null)

  const unavailableDates = useMemo(() => {
    return availability.availability
      .filter((day) => day.isFullyClosed || day.availableCount === 0)
      .map((day) => new Date(`${day.date}T00:00:00`))
  }, [availability.availability])

  const slotsByDate = useMemo(() => {
    const slots = {}
    const selected = availability.selectedDateAvailability
    if (selected?.date) {
      slots[selected.date] = selected.slots?.reduce((map, slot) => {
        map[slot.time] = slot.status
        return map
      }, {}) || {}
    }
    return slots
  }, [availability.selectedDateAvailability])

  const loadDate = useCallback(async (date) => {
    const dateKey = typeof date === 'string' ? date : toDateKey(date)
    return fetchDate(dateKey)
  }, [fetchDate])

  const createBooking = async (payload) => {
    setBookingError(null)
    try {
      return await submitBooking(payload)
    } catch (error) {
      setBookingError(error)
      throw error
    }
  }

  const holdSlot = async (payload) => {
    setBookingError(null)
    try {
      return await createBookingHold(payload)
    } catch (error) {
      setBookingError(error)
      throw error
    }
  }

  const releaseHold = async (payload) => {
    try {
      return await releaseBookingHold(payload)
    } catch {
      return false
    }
  }

  return {
    ...availability,
    appointments: slotsByDate,
    unavailableDates,
    loading: availability.loading,
    loadDate,
    holdSlot,
    releaseHold,
    submitBooking: createBooking,
    bookingError,
  }
}
