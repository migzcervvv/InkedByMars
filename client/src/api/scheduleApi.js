import { http } from './http'

export const scheduleApi = {
  list(params) {
    return http.get('/schedule', { params })
  },
  getByDate(date) {
    return http.get(`/schedule/${date}`)
  },
  changeClosure(date, operation) {
    return http.put(`/schedule/${date}/closure`, operation)
  },
}
