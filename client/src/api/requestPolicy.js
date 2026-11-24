export function shouldClearAdminSession(status, url = '') {
  return status === 401 && !/^\/?auth\/login(?:[/?]|$)/.test(url) && /^\/?(?:auth|bookings|schedule)(?:\/|$)/.test(url)
}
