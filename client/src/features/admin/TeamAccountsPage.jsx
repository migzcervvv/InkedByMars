import { useRef, useState } from 'react'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { Dialog } from '../../components/ui/Dialog'
import { useAuth } from '../../hooks/useAuth'
import { AccountForm } from './AccountForm'
import { AdminFeedback } from './AdminFeedback'
import { useAdminResource } from './useAdminResource'

const load = () => authApi.listUsers()
const titles = { create: 'Create admin', edit: 'Edit account', reset: 'Reset password', delete: 'Delete account' }

export default function TeamAccountsPage() {
  const { admin, updateProfile, clearSession } = useAuth()
  const navigate = useNavigate()
  const accounts = useAdminResource('team', load)
  const [action, setAction] = useState(null)
  const [message, setMessage] = useState('')
  const heading = useRef(null)
  const busyRef = useRef(false)
  const user = action?.user
  const self = Boolean(user && user.id === admin.id)

  function close() {
    if (!busyRef.current) setAction(null)
  }

  function saved(result) {
    if (result.signInAgain) {
      clearSession()
      navigate('/admin/login', { replace: true })
      return
    }
    if (self && result.admin) updateProfile(result.admin)
    setAction(null)
    setMessage(result.message)
    accounts.reload()
    if (action?.type === 'delete') requestAnimationFrame(() => heading.current?.focus())
  }

  return <div className="studio-screen studio-team">
    <header className="studio-screen-heading">
      <h1 tabIndex={-1} ref={heading}>Manage users</h1>
      <button type="button" className="studio-primary studio-icon-action" onClick={() => setAction({ type: 'create' })}><Plus size={17} aria-hidden="true" />Create admin</button>
    </header>
    {message && <p className="studio-result" role="status">{message}</p>}
    <section className="studio-panel" aria-label="Studio team" aria-busy={accounts.loading}>
      <AdminFeedback error={accounts.error} onRetry={accounts.reload} />
      {accounts.loading && !accounts.data && <p className="studio-panel-message" role="status">Loading users…</p>}
      {accounts.data?.users?.length === 0 && <p className="studio-panel-message">No users found.</p>}
      {accounts.data?.users?.length > 0 && <ul className="studio-team-list">
        {accounts.data.users.map(account => {
          const own = account.id === admin.id
          return <li key={account.id}>
            <div className="studio-team-identity">
              <strong>{account.name} {own && <small className="status-badge">You</small>}</strong>
              <span>{account.email}</span>
            </div>
            <span className="studio-team-role">{account.role === 'super_admin' ? 'Super admin' : 'Admin'}</span>
            <div className="studio-team-actions">
              <button type="button" className="studio-icon-action" aria-label={`Edit ${account.name}`} onClick={() => setAction({ type: 'edit', user: account })}><Pencil size={16} aria-hidden="true" />Edit</button>
              {!own && <>
                <button type="button" className="studio-icon-action" aria-label={`Reset password for ${account.name}`} onClick={() => setAction({ type: 'reset', user: account })}><KeyRound size={16} aria-hidden="true" />Reset password</button>
                <button type="button" className="studio-icon-action studio-danger-text" aria-label={`Delete ${account.name}`} onClick={() => setAction({ type: 'delete', user: account })}><Trash2 size={16} aria-hidden="true" />Delete</button>
              </>}
            </div>
          </li>
        })}
      </ul>}
    </section>
    <Dialog open={Boolean(action)} onClose={close} title={titles[action?.type] || 'Account'} className="studio-admin-dialog">
      {action && (['create', 'edit'].includes(action.type)
        ? <AccountForm key={user?.id || 'new'} user={user} self={self} onSaved={saved} onCancel={close} />
        : <TeamAccountAction key={`${action.type}-${user.id}`} action={action} busyRef={busyRef} onSaved={saved} onCancel={close} />)}
    </Dialog>
  </div>
}

function TeamAccountAction({ action, busyRef, onSaved, onCancel }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const removing = action.type === 'delete'
  const { user } = action

  async function submit(event) {
    event.preventDefault()
    if (busyRef.current) return
    const password = new FormData(event.currentTarget).get('password')
    busyRef.current = true
    setSaving(true)
    setError(null)
    try {
      const result = removing ? await authApi.deleteUser(user.id) : await authApi.resetPassword(user.id, password)
      onSaved(result)
    } catch (failure) {
      setError(failure)
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  return <form className="studio-fields" onSubmit={submit}>
    <p><strong>{user.name}</strong><br /><span className="studio-meta">{user.email}</span></p>
    <p>{removing ? 'This permanently removes the account and ends its studio access.' : 'Saving a new password signs this user out of their current sessions.'}</p>
    {!removing && <label>New password<input type="password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} />
      <small className="studio-meta">At least 8 characters, including an uppercase letter and a number.</small>
    </label>}
    <AdminFeedback error={error && { ...error, message: Object.values(error.fields || {})[0] || error.message }} />
    <div className="studio-form-footer">
      <button type="button" className="studio-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
      <button type="submit" className="studio-primary" disabled={saving}>{saving ? 'Saving…' : titles[action.type]}</button>
    </div>
  </form>
}
