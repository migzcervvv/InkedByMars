import axios from 'axios'
import { mockAppointments } from '../data/mockAppointments'

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL

export async function fetchAppointments() {
  if (!apiBaseUrl) return mockAppointments

  try {
    const { data } = await axios.get(`${apiBaseUrl}/api/appointments`)
    return data?.appointments || mockAppointments
  } catch {
    return mockAppointments
  }
}

export async function submitBooking(payload) {
  if (apiBaseUrl) {
    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/appointments`, payload)
      return data
    } catch {
      // Keep the frontend usable before the backend exists.
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    id: `MARS-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
    ...payload,
  }
}
