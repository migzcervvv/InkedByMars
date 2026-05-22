const tone = {
  pending: 'border-[#b88917]/35 bg-[#f1c45e]/20 text-[#7a5410]',
  confirmed: 'border-[#277a48]/35 bg-[#57c785]/15 text-[#1f6a3c]',
  completed: 'border-ink/20 bg-ink/10 text-ink',
  cancelled: 'border-red/35 bg-red/10 text-red',
  'on-hold': 'border-[#7a62d6]/35 bg-[#7a62d6]/10 text-[#5741b8]',
}

export function BookingStatusBadge({ status }) {
  return (
    <span className={`inline-flex border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] ${tone[status] || tone.pending}`}>
      {status}
    </span>
  )
}

