import { Link } from 'react-router-dom'

export function Button({ children, to, variant = 'solid', className = '', ...props }) {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 border px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    solid: 'border-red bg-red text-cream hover:border-red-dark hover:bg-red-dark',
    outline: 'border-cream/70 bg-transparent text-cream hover:border-red hover:text-red',
    leather: 'border-leather bg-leather text-cream hover:border-red hover:text-red',
    ghost: 'border-transparent bg-transparent text-ink hover:border-red hover:text-red',
  }
  const classes = `${base} ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
