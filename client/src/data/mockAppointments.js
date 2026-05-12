export const slotTimes = ['10:00', '12:00', '14:00', '16:00']

const statuses = ['booked', 'available', 'pending', 'available', 'closed', 'booked', 'available', 'booked']
const startDate = new Date('2026-05-11T00:00:00')

function isoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const mockAppointments = Array.from({ length: 21 }, (_, dayIndex) => {
  const date = new Date(startDate)
  date.setDate(startDate.getDate() + dayIndex)
  const isSunday = date.getDay() === 0

  return [
    isoDate(date),
    Object.fromEntries(
      slotTimes.map((time, slotIndex) => [
        time,
        isSunday ? 'closed' : statuses[(dayIndex + slotIndex * 2) % statuses.length],
      ]),
    ),
  ]
}).reduce((acc, [date, slots]) => ({ ...acc, [date]: slots }), {})
