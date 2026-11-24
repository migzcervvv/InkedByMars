import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { studio } from '../../config/studio'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
const destinations = [{ to: '/', label: 'Overview' }, { to: '/works', label: 'My Works' }, { to: '/booking', label: 'Booking' }]
export function Navbar() {
  const [menuPath, setMenuPath] = useState(null)
  const { pathname } = useLocation()
  const [hiddenMenuPath, setHiddenMenuPath] = useState(null)
  const open = menuPath === pathname
  useEffect(() => {
    if (pathname === '/' || open) return
    let previousY = Math.max(0, window.scrollY)
    function updateMenu() {
      const currentY = Math.max(0, window.scrollY)
      if (currentY <= 8) {
        setHiddenMenuPath(null)
      } else if (Math.abs(currentY - previousY) >= 8) {
        setHiddenMenuPath(currentY > previousY ? pathname : null)
      } else {
        return
      }
      previousY = currentY
    }
    window.addEventListener('scroll', updateMenu, { passive: true })
    return () => window.removeEventListener('scroll', updateMenu)
  }, [pathname, open])
  const close = () => setMenuPath(null)
  const home = pathname === '/'
  const trigger = (
    <InkMenuButton expanded={open} hidden={!home && !open && hiddenMenuPath === pathname} onClick={() => {
      setHiddenMenuPath(null)
      setMenuPath(pathname)
    }} />
  )

  return <>
    {home ? (
      <header className="home-nav">
        <Link to="/" aria-label="Inked by Mars home"><img className="home-seal" src="/studio-seal.webp" alt="" /></Link>
        {trigger}
      </header>
    ) : (
      <header className="site-header"><div className="frame header-inner">
        <Link to="/" className="brand" aria-label="Inked by Mars home">
          <span className="brand-seal"><img src={studio.logo} alt="" width="1440" height="810" /></span>
          <span>{studio.name}</span>
        </Link>
        <nav className="desktop-navigation" aria-label="Main navigation">
          {destinations.map(({ to, label }) => <NavLink end key={to} to={to}>{label}</NavLink>)}
        </nav>
        <Button to="/booking" className="header-book">Request a session</Button>
        {trigger}
      </div></header>
    )}
    <Dialog open={open} onClose={close} title="Navigation" className={home ? 'ink-navigation ink-navigation-home' : 'ink-navigation'} closeControl={<InkMenuButton closing onClick={close} />}>
      <div className="ink-navigation-panel">
        <h2>Navigation</h2>
        <nav aria-label="Studio navigation">
          {destinations.map(({ to, label }) => <NavLink end key={to} to={to} onClick={close}>{label}</NavLink>)}
        </nav>
        <div className="ink-navigation-social">
          <a href={studio.instagram} target="_blank" rel="noreferrer">{studio.instagramHandle} ↗</a>
          <a href={studio.flashInstagram} target="_blank" rel="noreferrer">{studio.flashHandle} ↗</a>
        </div>
      </div>
    </Dialog>
  </>
}

function InkMenuButton({ closing = false, expanded = closing, hidden = false, onClick }) {
  return (
    <button type="button" className="ink-menu-button" data-scroll-hidden={hidden}
      aria-label={closing ? 'Close navigation' : 'Show menu'} aria-expanded={expanded}
      aria-haspopup={closing ? undefined : 'dialog'} onClick={onClick}>
      <span className="ink-menu-label" aria-hidden="true"><span>Menu</span><span>Close</span></span>
      <svg viewBox="0 0 60 40" fill="currentColor" aria-hidden="true">
        <path d="M4 11 C18 4 45 5 57 8 C38 8 16 11 4 11 Z" />
        <path d="M11 22 C23 15 44 16 57 18 C42 19 24 22 11 22 Z" />
        <path d="M19 33 C32 26 47 27 57 29 C45 29 30 33 19 33 Z" />
      </svg>
    </button>
  )
}
