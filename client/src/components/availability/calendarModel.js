export function getDateStatus({ dateKey, todayKey, earliestDate, allowPast = false, day, blocked = false, booked = false, requireKnown = false, loading = false }) {
  if (loading) return 'loading'
  if (!allowPast && dateKey < todayKey) return 'past'
  if (earliestDate && dateKey < earliestDate) return 'policy'
  if (blocked || day?.isBlocked || day?.isFullyClosed || day?.availabilityStatus === 'blocked') return 'blocked'
  if (booked || day?.isFullyBooked || day?.availableCount === 0) return 'booked'
  if (!day && requireKnown) return 'unknown'
  if (day?.isPartiallyBooked || day?.availabilityStatus === 'partial') return 'limited'
  return 'available'
}
