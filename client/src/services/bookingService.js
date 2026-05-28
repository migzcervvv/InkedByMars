import { publicApi } from '../api/publicApi'

export async function fetchAvailabilityRange(params) {
  const data = await publicApi.getAvailability(params)
  return data.availability || []
}

export async function fetchAvailabilityByDate(date) {
  return publicApi.getAvailabilityByDate(date)
}

export async function submitBooking(payload) {
  const data = await publicApi.createBooking(payload)
  return data.booking
}

export async function createBookingHold(payload) {
  const data = await publicApi.createHold(payload)
  return data.hold
}

export async function releaseBookingHold(payload) {
  const data = await publicApi.releaseHold(payload)
  return data.released
}
