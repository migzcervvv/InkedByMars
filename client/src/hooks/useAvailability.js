import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { publicApi } from '../api/publicApi'
import { addMonths, toDateKey } from '../utils/date'

export function useAvailability(initialStartDate = new Date(), initialEndDate = addMonths(new Date(), 2)) {
  const [range, setRangeState] = useState(() => ({ startDate: toDateKey(initialStartDate), endDate: toDateKey(initialEndDate) }))
  const [availability, setAvailability] = useState([])
  const [policy, setPolicy] = useState(null)
  const [selectedDateAvailability, setSelectedDateAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateLoading, setDateLoading] = useState(false)
  const [rangeError, setRangeError] = useState(null)
  const [dateError, setDateError] = useState(null)
  const rangeRef = useRef(range)
  const rangeRequest = useRef(0)
  const dateRequest = useRef(0)
  const dateController = useRef(null)
  const mounted = useRef(false)
  const { startDate, endDate } = range

  const setRange = useCallback(nextRange => {
    const next = typeof nextRange === 'function' ? nextRange(rangeRef.current) : nextRange
    if (next.startDate === rangeRef.current.startDate && next.endDate === rangeRef.current.endDate) return
    rangeRef.current = next
    rangeRequest.current += 1
    dateRequest.current += 1
    dateController.current?.abort()
    setAvailability([]); setSelectedDateAvailability(null); setDateLoading(false); setDateError(null)
    setLoading(true); setRangeError(null); setRangeState(next)
  }, [])

  const refreshRange = useCallback(async () => {
    const requestId = ++rangeRequest.current
    setLoading(true); setRangeError(null)
    try {
      const data = await publicApi.getAvailability(rangeRef.current)
      if (!mounted.current || requestId !== rangeRequest.current) return []
      setAvailability(data.availability || [])
      setPolicy(data.policy || null)
      return data.availability || []
    } catch (error) {
      if (mounted.current && requestId === rangeRequest.current) { setAvailability([]); setRangeError(error) }
      return []
    } finally { if (mounted.current && requestId === rangeRequest.current) setLoading(false) }
  }, [])

  const fetchDate = useCallback(async date => {
    if (!date) return null
    dateController.current?.abort()
    const controller = new AbortController()
    dateController.current = controller
    const requestId = ++dateRequest.current
    setDateLoading(true); setDateError(null); setSelectedDateAvailability(null)
    try {
      const data = await publicApi.getAvailabilityByDate(date, { signal: controller.signal })
      if (!mounted.current || requestId !== dateRequest.current) return null
      setSelectedDateAvailability(data)
      if (data.policy) setPolicy(data.policy)
      return data
    } catch (error) {
      if (mounted.current && !controller.signal.aborted && requestId === dateRequest.current) setDateError(error)
      return null
    } finally { if (mounted.current && requestId === dateRequest.current) setDateLoading(false) }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; dateController.current?.abort(); dateRequest.current += 1; rangeRequest.current += 1 }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++rangeRequest.current
    publicApi.getAvailability({ startDate, endDate }, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted || requestId !== rangeRequest.current) return
        setAvailability(data.availability || [])
        setPolicy(data.policy || null)
      })
      .catch(error => { if (!controller.signal.aborted && requestId === rangeRequest.current) setRangeError(error) })
      .finally(() => { if (!controller.signal.aborted && requestId === rangeRequest.current) setLoading(false) })
    return () => controller.abort()
  }, [startDate, endDate])

  const availabilityByDate = useMemo(() => Object.fromEntries(availability.map(day => [day.date, day])), [availability])
  return { range, setRange, availability, availabilityByDate, policy, selectedDateAvailability, loading, dateLoading, rangeError, dateError, error: rangeError || dateError, refreshRange, fetchDate }
}
