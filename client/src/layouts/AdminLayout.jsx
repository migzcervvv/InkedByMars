import { useState } from 'react'
import { CalendarDays, ClipboardList, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { studio } from '../config/studio'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { Dialog } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { TeamAccounts } from '../features/admin/TeamAccounts'

const links = [
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Calendar', to: '/admin/calendar', icon: CalendarDays },
]

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, logout, clearSession, updateProfile } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const [managingAccounts, setManagingAccounts] = useState(false)
  const title = links.find(link => link.to === pathname)?.label || 'Studio'
  usePageMeta(`${title} · Studio`, 'Private Inked by Mars studio administration.')

  const signOut = async () => {
    await logout().catch(() => {})
    navigate('/admin/login', { replace: true })
  }

  return <div className="admin-shell">
    <aside className="studio-sidebar">
      <div className="studio-admin-brand"><img src="/mars-logo.svg" alt="" width="38" height="38" /><span>{studio.name}<small>Studio admin</small></span></div>
      <nav aria-label="Studio navigation">
        {links.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to}><Icon size={18} aria-hidden="true" />{label}</NavLink>)}
      </nav>
      <button type="button" className="studio-account" onClick={() => { setManagingAccounts(false); setAccountOpen(true) }} aria-label="Studio account"><UserRound size={18} aria-hidden="true" /><span>{admin?.name || 'Account'}</span></button>
    </aside>
    <main className="studio-admin-main"><Outlet /></main>
    <Dialog open={accountOpen} onClose={() => setAccountOpen(false)} title={managingAccounts ? (admin?.role === 'super_admin' ? 'Team accounts' : 'Edit account') : 'Studio account'} className="studio-admin-dialog">
      {managingAccounts && admin ? <TeamAccounts admin={admin} onProfile={updateProfile} onSignInAgain={() => {
        clearSession()
        navigate('/admin/login', { replace: true })
      }} /> : <>
        <p>{admin?.name}</p>
        <div className="studio-actions mt-4">
          <button type="button" className="studio-secondary" onClick={() => setManagingAccounts(true)}>{admin?.role === 'super_admin' ? 'Manage users' : 'Edit account'}</button>
          <Button to="/" variant="outline">Public website</Button><Button onClick={signOut}>Sign out</Button>
        </div>
      </>}
    </Dialog>
  </div>
}
