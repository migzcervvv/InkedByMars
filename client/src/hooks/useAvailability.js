import { useCallback, useEffect, useMemo, useState } from 'react'
import { publicApi } from '../api/publicApi'
import { addMonths, toDateKey } from '../utils/date'

export function useAvailability(initialStartDate = new Date(), initialEndDate = addMonths(new Date(), 2)) {
  const [range, setRange] = useState({
    startDate: toDateKey(initialStartDate),
    endDate: toDateKey(initialEndDate),
  })
  const [availability, setAvailability] = useState([])
  const [selectedDateAvailability, setSelectedDateAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateLoading, setDateLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshRange = useCallback(async (nextRange = range) => {
    setLoading(true)
    setError(null)

    try {
      const data = await publicApi.getAvailability(nextRange)
      setAvailability(data.availability || [])
      return data.availability || []
    } catch (nextError) {
      setError(nextError)
      return []
    } finally {
      setLoading(false)
    }
  }, [range])

  const fetchDate = useCallback(async (date) => {
    if (!date) return null
    setDateLoading(true)
    setError(null)

    try {
      const data = await publicApi.getAvailabilityByDate(date)
      setSelectedDateAvailability(data)
      return data
    } catch (nextError) {
      setError(nextError)
      return null
    } finally {
      setDateLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    publicApi.getAvailability({ startDate: range.startDate, endDate: range.endDate })
      .then((data) => {
        if (active) setAvailability(data.availability || [])
      })
      .catch((nextError) => {
        if (active) setError(nextError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [range.startDate, range.endDate])

  const availabilityByDate = useMemo(() => {
    return availability.reduce((map, day) => {
      map[day.date] = day
      return map
    }, {})
  }, [availability])

  return {
    range,
    setRange,
    availability,
    availabilityByDate,
    selectedDateAvailability,
    loading,
    dateLoading,
    error,
    refreshRange,
    fetchDate,
  }
}
