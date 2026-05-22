import { http } from './http'

export const publicApi = {
  getAvailability(params) {
    return http.get('/public/availability', { params })
  },

  getAvailabilityByDate(date) {
    return http.get(`/public/availability/${date}`)
  },

  createBooking(payload) {
    return http.post('/public/bookings', payload)
  },
}

