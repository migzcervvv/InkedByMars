import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { publicApi } from '../api/publicApi'
import { addMonths, toDateKey } from '../utils/date'

export function useAvailability(initialStartDate = new Date(), initialEndDate = addMonths(new Date(), 2)) {
  const [range, setRangeState] = useState({
    startDate: toDateKey(initialStartDate),
    endDate: toDateKey(initialEndDate),
  })
  const [availability, setAvailability] = useState([])
  const [selectedDateAvailability, setSelectedDateAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateLoading, setDateLoading] = useState(false)
  const [error, setError] = useState(null)
  const rangeRef = useRef(range)
  const dateRequestId = useRef(0)
  const { startDate, endDate } = range

  const setRange = useCallback((nextRange) => {
    const current = rangeRef.current
    const resolved = typeof nextRange === 'function' ? nextRange(current) : nextRange

    if (
      current.startDate === resolved.startDate &&
      current.endDate === resolved.endDate
    ) {
      return
    }

    rangeRef.current = resolved
    setLoading(true)
    setError(null)
    setRangeState(resolved)
  }, [])

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
    const requestId = dateRequestId.current + 1
    dateRequestId.current = requestId
    setDateLoading(true)
    setError(null)
    setSelectedDateAvailability(null)

    try {
      const data = await publicApi.getAvailabilityByDate(date)
      if (requestId !== dateRequestId.current) return null
      setSelectedDateAvailability(data)
      return data
    } catch (nextError) {
      if (requestId !== dateRequestId.current) return null
      if (nextError.isCanceled) return null
      setError(nextError)
      return null
    } finally {
      if (requestId === dateRequestId.current) setDateLoading(false)
    }
  }, [])

  useEffect(() => {
    rangeRef.current = { startDate, endDate }
    const controller = new AbortController()

    publicApi.getAvailability(
      { startDate, endDate },
      { signal: controller.signal },
    )
      .then((data) => {
        setAvailability(data.availability || [])
      })
      .catch((nextError) => {
        if (!nextError.isCanceled && nextError.name !== 'CanceledError' && nextError.code !== 'ERR_CANCELED') {
          setError(nextError)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [startDate, endDate])

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
