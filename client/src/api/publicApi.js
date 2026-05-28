import { http } from './http'

export const publicApi = {
  getAvailability(params, config = {}) {
    return http.get('/public/availability', { ...config, params })
  },

  getAvailabilityByDate(date, config = {}) {
    return http.get(`/public/availability/${date}`, config)
  },

  createBooking(payload) {
    return http.post('/public/bookings', payload)
  },

  createHold(payload) {
    return http.post('/public/holds', payload)
  },

  releaseHold(payload) {
    return http.post('/public/holds/release', payload)
  },
}
