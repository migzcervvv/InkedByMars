import { useRef, useState } from 'react'
import { authApi } from '../../api/authApi'
import { AdminFeedback } from './AdminFeedback'

export function AccountForm({ user, self = false, onSaved, onCancel }) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const pending = useRef(false)

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = new FormData(event.currentTarget)
    const payload = { name: fields.get('name').trim(), email: fields.get('email').trim() }
    if (fields.has('password')) payload.password = fields.get('password')
    if (fields.has('currentPassword')) payload.currentPassword = fields.get('currentPassword')
    pending.current = true
    setSaving(true)
    setError(null)
    try {
      const result = user ? await authApi.editUser(user.id, payload) : await authApi.createUser(payload)
      onSaved(result)
    } catch (failure) {
      setError(failure)
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <form className="studio-fields" onSubmit={save}>
    <label>Username<input name="name" required maxLength={100} autoComplete="off" defaultValue={user?.name || ''} /></label>
    <label>Email<input name="email" type="email" required autoComplete="off" defaultValue={user?.email || ''} /></label>
    {self && <label className="studio-inline-check"><input type="checkbox" checked={changingPassword} onChange={event => setChangingPassword(event.target.checked)} />Change password</label>}
    {self && changingPassword && <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password" /></label>}
    {(!user || changingPassword) && <label>{user ? 'New password' : 'Password'}
      <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
      <small className="studio-meta">At least 8 characters, including an uppercase letter and a number.</small>
    </label>}
    <AdminFeedback error={error && { ...error, message: Object.values(error.fields || {})[0] || error.message }} />
    <div className="studio-form-footer">
      <button type="button" className="studio-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
      <button className="studio-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : user ? 'Save changes' : 'Create account'}</button>
    </div>
  </form>
}
