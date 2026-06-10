import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, fromDateKey, toDateKey } from '../../utils/date'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function normalizeMonth(month) {
  const value = month instanceof Date ? month : new Date(`${month || toDateKey(new Date()).slice(0, 7)}-01T00:00:00`)
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function buildCalendarCells(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const cells = Array(firstDay.getDay()).fill(null)

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)))
  }

  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function AvailabilityCalendar({
  month,
  availabilityByDate = {},
  blockedDates = [],
  bookedDates = [],
  selectedDate,
  onDateSelect,
  onMonthChange,
  disableUnavailable = false,
  loading = false,
  selectable = true,
}) {
  const monthDate = normalizeMonth(month)
  const label = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const cells = buildCalendarCells(monthDate)
  const selectedKey = selectedDate ? toDateKey(selectedDate) : ''
  const todayKey = toDateKey(new Date())
  const blockedSet = new Set(blockedDates)
  const bookedSet = new Set(bookedDates)

  const changeMonth = (amount) => {
    onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() + amount, 1))
  }

  return (
    <div className="border border-ink/15 bg-surface/80 p-5 shadow-leather backdrop-blur sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!onMonthChange}
          className="grid size-10 place-items-center border border-ink/15 bg-cream/35 text-ink transition hover:border-red hover:text-red disabled:pointer-events-none disabled:opacity-25"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-center font-display text-3xl font-black italic leading-none text-ink sm:text-4xl">
          {label}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={!onMonthChange}
          className="grid size-10 place-items-center border border-ink/15 bg-cream/35 text-ink transition hover:border-red hover:text-red disabled:pointer-events-none disabled:opacity-25"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ash">
        <Legend tone="bg-cream/70" label="Available" />
        <Legend tone="bg-leather/25" label="Blocked" />
        <Legend tone="bg-red/75" label="Booked" />
        <Legend tone="bg-[#d49a38]/70" label="Limited" />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-2 text-center font-mono text-[10px] uppercase tracking-widest text-ash">
            {day}
          </div>
        ))}

        {cells.map((dateKey, index) => {
          if (!dateKey) return <div key={`pad-${index}`} className="aspect-square" />

          const day = availabilityByDate[dateKey]
          const isPast = dateKey < todayKey
          const isSelected = selectedKey === dateKey
          const isBlocked = blockedSet.has(dateKey) || day?.isBlocked || day?.availabilityStatus === 'blocked'
          const isBooked = bookedSet.has(dateKey) || day?.isFullyBooked || (!isBlocked && day?.availableCount === 0)
          const isLimited = !isBlocked && !isBooked && (day?.isPartiallyBooked || day?.availabilityStatus === 'partial')
          const isDisabled = isPast || (disableUnavailable && (isBlocked || isBooked))
          const canSelect = selectable && !isDisabled

          const stateClass = isBlocked
            ? 'border-leather/30 bg-leather/20 text-ink/40 line-through'
            : isBooked
              ? 'border-red/40 bg-red/30 text-ink/45 line-through'
              : isLimited
                ? 'border-[#a66a18]/40 bg-[#d49a38]/25 text-ink'
                : 'border-ink/15 bg-cream/35 text-ink hover:border-red hover:text-red'

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!canSelect}
              onClick={() => canSelect && onDateSelect?.(fromDateKey(dateKey))}
              className={[
                'relative flex aspect-square min-h-12 flex-col items-center justify-center border p-1 text-center transition focus:outline-none focus:ring-1 focus:ring-red',
                stateClass,
                isPast ? 'opacity-35' : '',
                isSelected ? 'border-red bg-red text-cream shadow-red line-through-0' : '',
                canSelect ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
              aria-label={`${dateKey} ${isBlocked ? 'blocked' : isBooked ? 'booked' : isLimited ? 'limited' : 'available'}`}
            >
              <span className="font-mono text-xs leading-none sm:text-sm">{fromDateKey(dateKey).getDate()}</span>
              <span
                className={[
                  'mt-1 h-1 w-1 rounded-full',
                  isSelected
                    ? 'bg-cream'
                    : isBlocked
                      ? 'bg-leather'
                      : isBooked
                        ? 'bg-red'
                        : isLimited
                          ? 'bg-[#d49a38]'
                          : 'bg-emerald-500',
                ].join(' ')}
              />
            </button>
          )
        })}
      </div>

      {loading && <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-ash">Loading availability</p>}
    </div>
  )
}

function Legend({ tone, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 border border-ink/20 ${tone}`} />
      {label}
    </span>
  )
}

export function addCalendarMonths(month, amount) {
  return normalizeMonth(addMonths(normalizeMonth(month), amount))
}