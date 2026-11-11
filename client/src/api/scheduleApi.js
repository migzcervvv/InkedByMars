import { http } from './http'

export const scheduleApi = {
  getDefaults() {
    return http.get('/schedule/default-times')
  },
  saveDefaults(defaults) {
    return http.put('/schedule/default-times', defaults)
  },
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
