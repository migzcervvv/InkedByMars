const tone = {
  pending: 'border-[#b88917]/35 bg-[#f1c45e]/20 text-[#7a5410]',
  confirmed: 'border-red/35 bg-red/15 text-red',
  completed: 'border-ash/40 bg-ash/20 text-ink/60',
  cancelled: 'border-red/35 bg-red/10 text-red',
  'on-hold': 'border-[#a66a18]/40 bg-[#d49a38]/30 text-[#7a5410]',
}

export function BookingStatusBadge({ status }) {
  return (
    <span className={`inline-flex border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] ${tone[status] || tone.pending}`}>
      {status}
    </span>
  )
}
