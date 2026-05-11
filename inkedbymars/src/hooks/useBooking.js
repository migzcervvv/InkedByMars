import { useEffect, useMemo, useState } from 'react'
import { fetchAppointments, submitBooking } from '../services/bookingService'

export function useBooking() {
  const [appointments, setAppointments] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchAppointments().then((data) => {
      if (mounted) {
        setAppointments(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const unavailableDates = useMemo(
    () =>
      Object.entries(appointments)
        .filter(([, slots]) => !Object.values(slots).some((status) => status === 'available'))
        .map(([date]) => new Date(`${date}T00:00:00`)),
    [appointments],
  )

  return { appointments, unavailableDates, loading, submitBooking }
}
