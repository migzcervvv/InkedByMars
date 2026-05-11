import { gsap } from 'gsap'

export function splitWords(text) {
  return text.split(' ').map((word, index) => ({ word, id: `${word}-${index}` }))
}

export function imageHoverHandlers() {
  return {
    onMouseEnter: (event) => gsap.to(event.currentTarget.querySelector('img'), { scale: 1.04, duration: 0.5, ease: 'power2.out' }),
    onMouseLeave: (event) => gsap.to(event.currentTarget.querySelector('img'), { scale: 1, duration: 0.4, ease: 'power2.inOut' }),
  }
}

export function formatDisplayDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function generateIcs({ date, time, name, style }) {
  const [hour] = time.split(':').map(Number)
  const start = new Date(date)
  start.setHours(hour, 0, 0, 0)
  const end = new Date(start)
  end.setHours(hour + 2)
  const stamp = (value) => value.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkedByMars//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@inkedbymars`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:InkedByMars tattoo appointment`,
    `DESCRIPTION:${name || 'Client'} - ${style || 'Tattoo consultation'}`,
    'LOCATION:Manila, Philippines',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
