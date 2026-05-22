const TOKEN_KEY = 'inkedbymars.admin.token'
const ADMIN_KEY = 'inkedbymars.admin.profile'

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY)
    return
  }

  window.localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredAdmin() {
  const value = window.localStorage.getItem(ADMIN_KEY)
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    window.localStorage.removeItem(ADMIN_KEY)
    return null
  }
}

export function setStoredAdmin(admin) {
  if (!admin) {
    window.localStorage.removeItem(ADMIN_KEY)
    return
  }

  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearStoredAuth() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(ADMIN_KEY)
}

