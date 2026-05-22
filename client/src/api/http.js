import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/app'
import { getStoredToken } from '../lib/storage'
import { normalizeApiError } from '../utils/errors'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export const http = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalized = normalizeApiError(error)

    if (normalized.status === 401 && unauthorizedHandler) {
      unauthorizedHandler(normalized)
    }

    return Promise.reject(normalized)
  },
)

