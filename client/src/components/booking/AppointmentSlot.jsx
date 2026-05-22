const labels = {
  available: 'Available',
  booked: 'Booked',
  closed: 'Closed',
  pending: 'On Hold',
  'on-hold': 'On Hold',
}

export function AppointmentSlot({ time, status, selected, onSelect }) {
  const isAvailable = status === 'available'
  const display = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}:00`))

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={onSelect}
      className={`slot slot-${status === 'on-hold' ? 'pending' : status} ${selected ? 'slot-selected' : ''}`}
    >
      <span className={status === 'booked' ? 'line-through' : ''}>{display}</span>
      <span>{labels[status] || status}</span>
    </button>
  )
}
