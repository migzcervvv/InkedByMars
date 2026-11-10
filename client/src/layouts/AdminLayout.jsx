import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, ClipboardList, LayoutDashboard, Clock, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { studio } from '../config/studio'

const links = [{ label: 'Overview', to: '/admin', icon: LayoutDashboard }, { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList }, { label: 'Schedule', to: '/admin/schedule', icon: CalendarDays }, { label: 'Availability', to: '/admin/availability', icon: Clock }, { label: 'Settings', to: '/admin/settings', icon: Settings }]
export function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { admin, logout } = useAuth()
  const title = links.find(link => link.to === pathname)?.label || 'Studio'
  usePageMeta(`${title} · Studio`, 'Private Inked by Mars studio administration.')
  const handleLogout = async () => { await logout(); navigate('/admin/login', { replace: true }) }
  return <div className="admin-shell min-h-svh bg-bg text-ink"><aside className="admin-sidebar fixed inset-x-0 bottom-0 z-50 px-2 py-2 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-60 lg:px-5 lg:py-7"><div className="hidden lg:block"><NavLink to="/" className="font-semibold no-underline">{studio.name}</NavLink><p className="mt-2 text-sm text-ash">Studio administration</p></div><nav aria-label="Studio navigation" className="grid grid-cols-5 gap-1 lg:mt-10 lg:grid-cols-1 lg:gap-2">{links.map(link => { const Icon = link.icon; return <NavLink key={link.to} to={link.to} end={link.to === '/admin'} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><Icon size={18} aria-hidden="true" /><span>{link.label}</span></NavLink> })}</nav><div className="absolute inset-x-5 bottom-7 hidden lg:block"><p className="text-sm text-ash">{admin?.role}</p><p className="mt-1 truncate">{admin?.name}</p><button type="button" onClick={handleLogout} className="text-button mt-4">Sign out</button></div></aside><main className="pb-24 lg:ml-60 lg:pb-0"><header className="sticky top-0 z-30 bg-bg px-5 py-5 lg:px-8"><div className="flex items-center justify-between gap-4"><h1>{title}</h1><button type="button" className="icon-button lg:hidden" aria-label="Sign out" onClick={handleLogout}><LogOut size={20} /></button></div></header><Outlet /></main></div>
}
