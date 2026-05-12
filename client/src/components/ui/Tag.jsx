export function Tag({ children, active = false, className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] ${
        active ? 'border-red bg-red text-cream' : 'border-ash/50 text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
