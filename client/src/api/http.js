import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/app'
import { getStoredToken } from '../lib/storage'
import { normalizeApiError } from '../utils/errors'
import { shouldClearAdminSession } from './requestPolicy'

let unauthorizedHandler = null
const DEBUG_API = import.meta.env.VITE_API_DEBUG === 'true'

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
  config.headers['X-Request-Id'] = crypto.randomUUID()
  config.metadata = { startedAt: performance.now() }
  return config
})

http.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      const durationMs = Math.round(performance.now() - response.config.metadata.startedAt)
      console.debug('[api]', response.config.method?.toUpperCase(), response.config.url, response.status, `${durationMs}ms`)
    }
    return response.data
  },
  async (error) => {
    const config = error.config || {}

    if (
      !axios.isCancel(error) &&
      !config.__retried &&
      ['get', 'head', 'options'].includes(config.method) &&
      (!error.response || error.response.status >= 500)
    ) {
      config.__retried = true
      await new Promise((resolve) => setTimeout(resolve, 300))
      return http(config)
    }

    const normalized = normalizeApiError(error)

    if (shouldClearAdminSession(normalized.status, config.url) && unauthorizedHandler) {
      unauthorizedHandler(normalized)
    }

    return Promise.reject(normalized)
  },
)
