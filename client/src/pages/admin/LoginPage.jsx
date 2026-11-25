import { formErrors } from '../../utils/formValidation'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePageMeta } from '../../hooks/usePageMeta'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { AdminFeedback } from '../../features/admin/AdminFeedback'
import { Notice } from '../../components/ui/Notice'
import { studio } from '../../config/studio'
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, sessionExpired } = useAuth()
  const [form, setForm] = useState({ name: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  usePageMeta('Studio access', 'Sign in to Inked by Mars studio administration.', { noIndex: true })
  if (isAuthenticated) return <Navigate to="/admin" replace />
  const submit = async event => {
    event.preventDefault()
    if (loading) return
    const validation = formErrors(event.currentTarget, { username: 'your username', password: 'your password' })
    if (validation) {
      setError(validation)
      return
    }
    setLoading(true); setError(null)
    try { await login(form); const destination = location.state?.from?.pathname; navigate(destination?.startsWith('/admin') ? destination : '/admin', { replace: true }) }
    catch (nextError) {
      if (nextError.status === 401) setError({ message: 'That username or password didn’t match. Check both and try again.' })
      else if (nextError.status === 403 && nextError.code === 'ACCOUNT_INACTIVE') setError({ message: 'This account is inactive. Ask the studio owner to restore your access.' })
      else setError(nextError)
    }
    finally { setLoading(false) }
  }
  return <main className="login-page"><Link to="/">{studio.name}</Link><form className="login-form" noValidate onSubmit={submit}><h1>Studio access</h1><p>Sign in to manage your appointments.</p>{sessionExpired && <Notice><p>Your studio session ended. Sign in again to continue.</p></Notice>}<AdminFeedback error={error} form /><Field label="Name" name="username" autoComplete="username" required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /><Field label="Password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} /><Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button></form><Link to="/">Back to the studio</Link></main>
}
