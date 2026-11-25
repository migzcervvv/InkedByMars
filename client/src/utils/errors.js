const messagesByStatus = {
  401: 'Your studio session ended. Sign in again to continue.',
  403: 'You don’t have permission to make this change.',
  404: 'This item may have been removed. Refresh the page and try again.',
  413: 'This submission is too large. Use less text or a smaller image.',
  429: 'Too many attempts. Wait a minute and try again.',
}

export function normalizeApiError(error, fallback = "Couldn’t connect. Check your internet connection and try again.") {
  if (!error) return { message: fallback, status: null, fields: {} }

  const isCanceled = error.code === 'ERR_CANCELED' || error.name === 'CanceledError'
  const status = error.response?.status || null
  const data = error.response?.data
  const code = data?.code || error.code
  const technicalFailure = status >= 500 || status === 408 || !status
  const message = isCanceled ? 'Request cancelled.'
    : status >= 500 ? 'The studio website couldn’t finish this request. Try again in a moment.'
    : status === 408 || ['ECONNABORTED', 'ETIMEDOUT'].includes(code) ? 'This is taking longer than expected. Check whether your change was saved before trying again.'
    : status === 404 && code === 'API_ERROR' ? 'This action is temporarily unavailable. Refresh the page and try again.'
    : messagesByStatus[status] || data?.message || (status ? 'Check your details and try again.' : fallback)
  const fields = {}

  if (!technicalFailure && Array.isArray(data?.errors)) {
    data.errors.forEach((item) => {
      const key = item.path || item.param || item.field
      const explanation = item.msg || item.message
      if (key && typeof explanation === 'string' && !Object.hasOwn(fields, key)) {
        Object.defineProperty(fields, key, { value: explanation, enumerable: true })
      }
    })
  }

  if (!technicalFailure && data?.error?.errors) {
    Object.entries(data.error.errors).forEach(([key, value]) => {
      if (typeof value?.message === 'string' && !Object.hasOwn(fields, key)) {
        Object.defineProperty(fields, key, { value: value.message, enumerable: true })
      }
    })
  }

  return {
    message,
    status,
    fields,
    code,
    details: data?.details,
    isCanceled,
    requestId: data?.requestId || error.response?.headers?.['x-request-id'] || null,
  }
}

export function fieldError(errors, name) {
  return errors?.[name] || ''
}
