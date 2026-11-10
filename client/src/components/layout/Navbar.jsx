import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { studio } from '../../config/studio'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
const destinations = [{ to: '/', label: 'Home' }, { to: '/works', label: 'Works' }, { to: '/booking', label: 'Booking' }]
export function Navbar() {
  const [menuPath, setMenuPath] = useState(null)
  const { pathname } = useLocation()
  const open = menuPath === pathname
  const close = () => setMenuPath(null)
  return <><header className="site-header"><div className="frame header-inner"><Link to="/" className="brand" onClick={close} aria-label="Inked by Mars home"><span className="brand-seal"><img src={studio.logo} alt="" width="1440" height="810" /></span><span>Inked by Mars</span></Link><nav className="desktop-navigation" aria-label="Main navigation">{destinations.map(link => <NavLink end={link.to === '/'} key={link.to} to={link.to}>{link.label}</NavLink>)}</nav><Button to="/booking" className="header-book">Request a session</Button><button type="button" className="icon-button menu-trigger" onClick={() => setMenuPath(pathname)} aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open}><Menu size={24} /></button></div></header><Dialog open={open} onClose={close} title="Explore the studio" className="navigation-dialog"><nav aria-label="Mobile navigation">{destinations.map(link => <NavLink end={link.to === '/'} key={link.to} to={link.to} onClick={close}>{link.label}</NavLink>)}</nav><p>{studio.location}<br />By appointment</p></Dialog></>
}
