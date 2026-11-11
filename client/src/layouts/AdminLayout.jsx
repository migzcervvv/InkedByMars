import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CalendarDays, ChevronDown, ClipboardList, LogOut, UserRound, UsersRound } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { studio } from '../config/studio'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { Dialog } from '../components/ui/Dialog'
import { AccountForm } from '../features/admin/AccountForm'

const links = [
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Calendar', to: '/admin/calendar', icon: CalendarDays },
]

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, logout, clearSession, updateProfile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const disclosure = useRef(null)
  const trigger = useRef(null)
  const title = pathname === '/admin/users' ? 'Manage users' : links.find(link => link.to === pathname)?.label || 'Studio'
  usePageMeta(`${title} · Studio`, 'Private Inked by Mars studio administration.')

  useEffect(() => {
    if (!menuOpen) return
    const dismiss = event => { if (!disclosure.current?.contains(event.target)) setMenuOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [menuOpen])

  const signOut = async () => {
    setMenuOpen(false)
    await logout().catch(() => {})
    navigate('/admin/login', { replace: true })
  }
  const saveProfile = result => {
    setProfileOpen(false)
    if (result.signInAgain) {
      clearSession()
      navigate('/admin/login', { replace: true })
    } else updateProfile(result.admin)
  }

  return <div className="admin-shell">
    <aside className="studio-sidebar">
      <div className="studio-admin-brand"><img src="/mars-logo.svg" alt="" width="58" height="58" /><span>{studio.name}<small>Studio admin</small></span></div>
      <nav aria-label="Studio navigation">
        {links.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}
      </nav>
      <div className="studio-account-area" ref={disclosure} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false)
      }} onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false)
          trigger.current?.focus()
        }
      }}>
        <button ref={trigger} type="button" className="studio-account" onClick={() => setMenuOpen(open => !open)}
          aria-label="Studio account" aria-expanded={menuOpen} aria-controls="studio-account-actions">
          <UserRound size={18} aria-hidden="true" /><span>{admin?.name || 'Account'}</span><ChevronDown size={14} aria-hidden="true" />
        </button>
        <div className="studio-account-panel" id="studio-account-actions" hidden={!menuOpen}>
          <div className="studio-account-identity"><strong>{admin?.name}</strong><span>{admin?.email}</span></div>
          <div className="studio-account-actions">
            <button type="button" onClick={() => { trigger.current?.focus(); setMenuOpen(false); setProfileOpen(true) }}><UserRound size={16} aria-hidden="true" />Edit account</button>
            {admin?.role === 'super_admin' && <Link to="/admin/users" onClick={() => setMenuOpen(false)}><UsersRound size={16} aria-hidden="true" />Manage users</Link>}
            <Link to="/" onClick={() => setMenuOpen(false)}><ArrowUpRight size={16} aria-hidden="true" />Public website</Link>
            <button type="button" onClick={signOut}><LogOut size={16} aria-hidden="true" />Sign out</button>
          </div>
        </div>
      </div>
    </aside>
    <main className="studio-admin-main"><Outlet /></main>
    <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} title="Edit account" className="studio-admin-dialog">
      {admin && <AccountForm user={admin} self onSaved={saveProfile} onCancel={() => setProfileOpen(false)} />}
    </Dialog>
  </div>
}
