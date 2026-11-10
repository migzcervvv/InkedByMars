const labels = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', 'on-hold': 'On hold' }
export function BookingStatusBadge({ status }) { return <span className="status-badge" data-status={status}>{labels[status] || 'Unknown status'}</span> }
