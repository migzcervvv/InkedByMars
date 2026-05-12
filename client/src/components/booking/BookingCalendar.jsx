import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { AppointmentSlot } from './AppointmentSlot'
import { slotTimes } from '../../data/mockAppointments'
import { formatDisplayDate } from '../../utils/animations'

function toKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function BookingCalendar({ appointments, unavailableDates, selectedDate, selectedSlot, onDateChange, onSlotChange }) {
  const slots = appointments[toKey(selectedDate)] || {}
  const disabled = (date) => date.getDay() === 0

  return (
    <section className="booking-panel">
      <div className="mb-6">
        <p className="eyebrow">Choose Date</p>
        <h2 className="section-title mt-2 text-4xl">Availability</h2>
      </div>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateChange(date)}
        disabled={disabled}
        modifiers={{ noAvailable: unavailableDates }}
        showOutsideDays
        className="mars-day-picker"
      />
      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ash">{formatDisplayDate(selectedDate)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {slotTimes.map((time) => (
            <AppointmentSlot
              key={time}
              time={time}
              status={slots[time] || (selectedDate.getDay() === 0 ? 'closed' : 'available')}
              selected={selectedSlot === time}
              onSelect={() => onSlotChange(time)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
