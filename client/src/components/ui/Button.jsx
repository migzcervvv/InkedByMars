import { Link } from 'react-router-dom'
export function Button({ children, to, href, variant = 'solid', className = '', type = 'button', ...props }) {
  const classes = `button button-${variant} ${className}`
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>
  if (href) return <a href={href} className={classes} {...props}>{children}</a>
  return <button type={type} className={classes} {...props}>{children}</button>
}
