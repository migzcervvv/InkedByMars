import { formatDisplayTime } from '../../utils/date'
const labels = { available: 'Available', booked: 'Booked', closed: 'Closed', pending: 'Held', 'on-hold': 'Held' }
export function AppointmentSlot({ time, status, selected, loading, onSelect }) {
  const available = status === 'available'
  return <button type="button" disabled={!available || loading} onClick={onSelect} aria-pressed={selected} className={`appointment-slot ${selected ? 'is-selected' : ''}`}><span>{formatDisplayTime(time)}</span><span>{loading ? 'Checking' : labels[status] || 'Unavailable'}</span></button>
}
