import { http } from './http'

export const bookingApi = {
  list(params = {}) {
    return http.get('/bookings', { params })
  },

  dashboard() {
    return http.get('/bookings/dashboard')
  },

  getById(id) {
    return http.get(`/bookings/${id}`)
  },

  create(payload) {
    return http.post('/bookings', payload)
  },

  update(id, payload) {
    return http.put(`/bookings/${id}`, payload)
  },

  updateStatus(id, payload) {
    return http.put(`/bookings/${id}/status`, payload)
  },

  remove(id) {
    return http.delete(`/bookings/${id}`)
  },
}

