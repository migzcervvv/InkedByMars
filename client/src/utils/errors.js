export function normalizeApiError(error, fallback = 'Something went wrong') {
  if (!error) return { message: fallback, status: null, fields: {} }

  const status = error.response?.status || null
  const data = error.response?.data
  const fields = {}

  if (Array.isArray(data?.errors)) {
    data.errors.forEach((item) => {
      const key = item.path || item.param || item.field
      if (key) fields[key] = item.msg || item.message || fallback
    })
  }

  if (data?.error?.errors) {
    Object.entries(data.error.errors).forEach(([key, value]) => {
      fields[key] = value.message || fallback
    })
  }

  return {
    message: data?.message || error.message || fallback,
    status,
    fields,
  }
}

export function fieldError(errors, name) {
  return errors?.[name] || ''
}

