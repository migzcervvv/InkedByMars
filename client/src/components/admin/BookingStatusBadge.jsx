const tone = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",

  confirmed: "border-green-500/30 bg-green-500/10 text-green-700",

  completed: "border-slate-400/30 bg-slate-500/10 text-slate-600",

  cancelled: "border-red-500/30 bg-red-500/10 text-red-700",

  "on-hold": "border-orange-500/30 bg-orange-500/15 text-orange-700",
};

export function BookingStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] ${tone[status] || tone.pending}`}
    >
      {status}
    </span>
  );
}
