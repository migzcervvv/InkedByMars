export function studioTodayKey() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = type => parts.find(part => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function toDateKey(date) {
  if (!date) return ''
  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`)
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function addMonths(date, amount) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

export function startOfWeek(date = new Date()) {
  const next = new Date(date)
  const day = next.getDay()
  next.setDate(next.getDate() - day)
  return next
}

export function endOfWeek(date = new Date()) {
  return addDays(startOfWeek(date), 6)
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function eachDateKey(startDate, endDate) {
  const dates = []
  let cursor = fromDateKey(toDateKey(startDate))
  const end = fromDateKey(toDateKey(endDate))

  while (cursor <= end) {
    dates.push(toDateKey(cursor))
    cursor = addDays(cursor, 1)
  }

  return dates
}

export function scopeToDateRange(scope, customStart, customEnd) {
  const today = new Date()

  if (scope === 'this_week') {
    return { startDate: toDateKey(startOfWeek(today)), endDate: toDateKey(endOfWeek(today)) }
  }

  if (scope === 'this_month') {
    return { startDate: toDateKey(startOfMonth(today)), endDate: toDateKey(endOfMonth(today)) }
  }

  if (scope === 'range') {
    return { startDate: customStart, endDate: customEnd }
  }

  return { startDate: toDateKey(today), endDate: toDateKey(addMonths(today, 3)) }
}

export function formatDisplayDate(value) {
  const date = value instanceof Date ? value : fromDateKey(value)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatDisplayTime(time) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`2026-01-01T${time}:00`))
}

const studioTimestamp = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

export function formatStudioTimestamp(value) {
  return value ? studioTimestamp.format(new Date(value)) : '—'
}

