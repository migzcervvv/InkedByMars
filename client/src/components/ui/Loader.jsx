export function Loader({ label = 'Loading' }) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <div className="mx-auto mb-4 size-10 animate-spin border-2 border-ash border-t-red" />
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ash">{label}</p>
      </div>
    </div>
  )
}
