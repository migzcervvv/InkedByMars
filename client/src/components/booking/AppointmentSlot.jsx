const labels = {
  available: 'Available',
  booked: 'Confirmed',
  closed: 'Closed',
  pending: 'Held',
  'on-hold': 'Held',
}

export function AppointmentSlot({ time, status, selected, loading, onSelect }) {
  const isAvailable = status === 'available'
  const display = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))

  return (
    <button
      type="button"
      disabled={!isAvailable || loading}
      onClick={onSelect}
      className={`slot slot-${status === 'on-hold' ? 'pending' : status} ${selected && isAvailable ? 'slot-selected' : ''} ${selected && !isAvailable ? 'slot-held-selected' : ''}`}
    >
      <span className={status === 'booked' ? 'line-through' : ''}>{display}</span>
      <span>{loading ? 'Holding' : labels[status] || status}</span>
    </button>
  )
}
