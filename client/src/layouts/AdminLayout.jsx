import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, CalendarDays, ClipboardList, Clock, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const adminLinks = [
  { label: 'Dashboard', to: '/admin', icon: BarChart3 },
  { label: 'Bookings', to: '/admin/bookings', icon: ClipboardList },
  { label: 'Schedule', to: '/admin/schedule', icon: CalendarDays },
  { label: 'Availability', to: '/admin/availability', icon: Clock },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { admin, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-cream/95 px-2 py-2 backdrop-blur lg:inset-y-0 lg:left-0 lg:right-auto lg:w-64 lg:border-r lg:border-t-0 lg:px-4 lg:py-6">
        <div className="hidden lg:block">
          <p className="font-display text-2xl font-black tracking-[0.08em]">
            INKED BY <span className="text-red">MARS</span>
          </p>
          <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ash">Admin studio</p>
        </div>

        <nav className="grid grid-cols-5 gap-1 lg:mt-10 lg:grid-cols-1 lg:gap-2">
          {adminLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center gap-2 px-3 font-mono text-[0.62rem] uppercase tracking-[0.1em] transition lg:justify-start lg:text-xs ${
                    isActive ? 'bg-red text-cream' : 'text-ash hover:bg-ink/5 hover:text-ink'
                  }`
                }
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto hidden border-t border-ink/10 pt-5 lg:block lg:absolute lg:inset-x-4 lg:bottom-6">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ash">{admin?.role}</p>
          <p className="mt-1 truncate font-body text-2xl leading-tight">{admin?.name}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-red"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main className="pb-24 lg:ml-64 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-red">Admin</p>
              <h1 className="font-display text-3xl italic leading-none text-ink">Studio Control</h1>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid size-11 place-items-center border border-ink/15 text-ink transition hover:border-red hover:text-red lg:hidden"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
