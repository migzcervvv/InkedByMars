import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ADMIN_LOGIN_PATH } from '../config/app'
import { useAuth } from '../hooks/useAuth'
import { Loader } from '../components/ui/Loader'

export function ProtectedRoute({ roles }) {
  const location = useLocation()
  const { booting, isAuthenticated, role } = useAuth()

  if (booting) {
    return (
      <div className="grid min-h-svh place-items-center bg-cream">
        <Loader label="Checking studio keys" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace state={{ from: location }} />
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
