import { http } from './http'

export const scheduleApi = {
  list(params = {}) {
    return http.get('/schedule', { params })
  },

  getByDate(date) {
    return http.get(`/schedule/${date}`)
  },

  blockDay(payload) {
    return http.post('/schedule/block-day', payload)
  },

  blockSlot(payload) {
    return http.post('/schedule/block-slot', payload)
  },

  releaseSlot(payload) {
    return http.post('/schedule/release-slot', payload)
  },

  overrideSlot(payload) {
    return http.post('/schedule/override-slot', payload)
  },

  expireHolds() {
    return http.post('/schedule/expire-holds')
  },

  applyOpeningWindow(payload) {
    return http.post('/schedule/opening-window', payload)
  },

  async blockDateRange({ startDate, endDate, dayStatus, closureReason }) {
    const { eachDateKey } = await import('../utils/date')
    const dates = eachDateKey(startDate, endDate)
    const results = await Promise.all(
      dates.map((date) => scheduleApi.blockDay({ date, dayStatus, closureReason })),
    )
    return results.at(-1)
  },

  async applyOpeningWindowLegacy({ scope, startDate, endDate, openTime, closeTime, slots, reason }) {
    const { eachDateKey, scopeToDateRange } = await import('../utils/date')
    const range = scopeToDateRange(scope, startDate, endDate)
    const dates = eachDateKey(range.startDate, range.endDate)
    const changes = []

    dates.forEach((date) => {
      slots.forEach((slot) => {
        const shouldBeOpen = slot >= openTime && slot < closeTime
        changes.push(
          shouldBeOpen
            ? scheduleApi.releaseSlot({ date, time: slot })
            : scheduleApi.blockSlot({ date, time: slot, reason }),
        )
      })
    })

    return Promise.allSettled(changes)
  },
}
