import { useCallback, useMemo, useState } from 'react'
import { createBookingHold, releaseBookingHold, submitBooking } from '../services/bookingService'
import { useAvailability } from './useAvailability'
import { toDateKey } from '../utils/date'

export function useBooking() {
  const availability = useAvailability()
  const { fetchDate } = availability
  const [bookingError, setBookingError] = useState(null)

  const blockedDates = useMemo(() => {
    return availability.availability
      .filter((day) => day.isBlocked || day.isFullyClosed || day.availabilityStatus === 'blocked')
      .map((day) => day.date)
  }, [availability.availability])

  const bookedDates = useMemo(() => {
    return availability.availability
      .filter((day) => {
        const isBlocked = day.isBlocked || day.isFullyClosed || day.availabilityStatus === 'blocked'
        return !isBlocked && (day.isFullyBooked || day.availableCount === 0)
      })
      .map((day) => day.date)
  }, [availability.availability])

  const unavailableDates = useMemo(() => {
    return [...blockedDates, ...bookedDates].map((date) => new Date(`${date}T00:00:00`))
  }, [blockedDates, bookedDates])

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
    blockedDates,
    bookedDates,
    loading: availability.loading,
    loadDate,
    holdSlot,
    releaseHold,
    submitBooking: createBooking,
    bookingError,
  }
}