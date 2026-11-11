import { useRef, useState } from 'react'
import { authApi } from '../../api/authApi'
import { AdminFeedback } from './AdminFeedback'
import { useAdminResource } from './useAdminResource'

const load = () => authApi.listUsers()

export function TeamAccounts({ admin, onProfile, onSignInAgain }) {
  const canManage = admin.role === 'super_admin'
  const users = useAdminResource(canManage ? 'team' : null, load)
  const [selection, setSelection] = useState(canManage ? null : admin)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const formRef = useRef(null)
  const creating = selection === 'new'
  const editingSelf = selection?.id === admin.id

  function choose(user) {
    setSelection(user)
    setFeedback('')
    setError(null)
    requestAnimationFrame(() => formRef.current?.querySelector('input')?.focus())
  }

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = new FormData(event.currentTarget)
    const payload = { name: fields.get('name').trim(), email: fields.get('email').trim() }
    if (fields.get('password')) payload.password = fields.get('password')
    if (editingSelf && payload.password) payload.currentPassword = fields.get('currentPassword')
    pending.current = true
    setSaving(true)
    setError(null)
    try {
      const result = creating ? await authApi.createUser(payload) : await authApi.editUser(selection.id, payload)
      formRef.current?.reset()
      if (result.signInAgain) { onSignInAgain(); return }
      if (editingSelf) onProfile(result.admin)
      setSelection(canManage ? null : result.admin)
      setFeedback(result.message)
      users.reload()
    } catch (failure) {
      setError(failure)
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <div className="studio-fields">
    {feedback && <p role="status">{feedback}</p>}
    {canManage && !selection && <>
      <div className="studio-actions"><button type="button" className="studio-primary" onClick={() => choose('new')}>Create admin</button></div>
      {users.loading && <p role="status">Loading admin accounts…</p>}
      <AdminFeedback error={users.error} onRetry={users.reload} />
      <ul className="studio-history">{users.data?.users?.map(user => <li key={user.id}>
        <span><strong>{user.name}</strong><br />{user.email}</span>
        <button type="button" className="studio-plain" aria-label={`Edit ${user.name}`} onClick={() => choose(user)}>Edit</button>
      </li>)}</ul>
    </>}
    {selection && <form key={creating ? 'new' : selection.id} ref={formRef} className="studio-fields" onSubmit={save}>
      <h3>{creating ? 'Create admin account' : `Edit ${selection.name}`}</h3>
      <label>Username<input name="name" required maxLength={100} autoComplete="off" defaultValue={selection.name || ''} /></label>
      <label>Email<input name="email" type="email" required autoComplete="off" defaultValue={selection.email || ''} /></label>
      <label>{creating ? 'Password' : 'New password (optional)'}<input name="password" type="password" required={creating} minLength={8} maxLength={72} autoComplete="new-password" /></label>
      <p className="studio-meta">Use at least 8 characters, including an uppercase letter and a number.</p>
      {editingSelf && <label>Current password (required to change password)<input name="currentPassword" type="password" autoComplete="current-password" /></label>}
      <AdminFeedback error={error && { ...error, message: Object.values(error.fields || {})[0] || error.message }} />
      <div className="studio-actions">
        <button className="studio-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : creating ? 'Create account' : 'Save account'}</button>
        {canManage && <button type="button" className="studio-plain" disabled={saving} onClick={() => choose(null)}>Back to team</button>}
      </div>
    </form>}
  </div>
}
