export function getDateStatus({ dateKey, todayKey, day, blocked = false, booked = false, requireKnown = false, loading = false }) {
  if (loading) return 'loading'
  if (dateKey < todayKey) return 'past'
  if (blocked || day?.isBlocked || day?.isFullyClosed || day?.availabilityStatus === 'blocked') return 'blocked'
  if (booked || day?.isFullyBooked || day?.availableCount === 0) return 'booked'
  if (!day && requireKnown) return 'unknown'
  if (day?.isPartiallyBooked || day?.availabilityStatus === 'partial') return 'limited'
  return 'available'
}
