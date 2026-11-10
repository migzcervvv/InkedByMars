export function shouldClearAdminSession(status, url = '') {
  return status === 401 && /^\/?(?:auth|bookings|schedule)(?:\/|$)/.test(url)
}
