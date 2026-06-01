// AvailabilityPage.jsx
import { useState } from "react";
import { useAvailability } from "../hooks/useAvailability";
import { Button } from "../components/ui/Button";
import { Loader } from "../components/ui/Loader";
import {
  toDateKey,
  fromDateKey,
  addMonths,
  formatDisplayTime,
} from "../utils/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells = Array(firstDay.getDay()).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(toDateKey(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function MonthCalendar({
  year,
  month,
  availabilityByDate,
  selectedDate,
  todayKey,
  onSelect,
}) {
  const cells = buildCalendarCells(year, month);
  const label = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-red">
        {label}
      </p>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-center font-mono text-[10px] uppercase tracking-widest text-ash"
          >
            {d}
          </div>
        ))}

        {cells.map((dateKey, i) => {
          if (!dateKey) return <div key={`pad-${i}`} />;

          const day = availabilityByDate[dateKey];
          const isPast = dateKey < todayKey;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;

          // Dot state
          let dotClass = "bg-ink/10"; // no data / past
          if (!isPast && day) {
            if (day.isFullyClosed) dotClass = "bg-red/40";
            else if (day.availableCount > 0) dotClass = "bg-emerald-500";
            else dotClass = "bg-ash/40";
          }

          return (
            <button
              key={dateKey}
              disabled={isPast}
              onClick={() => onSelect(dateKey)}
              className={[
                "group relative flex flex-col items-center gap-1 py-2 transition-colors focus:outline-none",
                isPast
                  ? "cursor-default opacity-25"
                  : "cursor-pointer hover:bg-surface/60",
                isSelected ? "bg-red/10 ring-1 ring-inset ring-red/40" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "font-mono text-xs leading-none",
                  isToday ? "text-red" : "text-ink",
                  isSelected ? "font-semibold" : "",
                ].join(" ")}
              >
                {fromDateKey(dateKey).getDate()}
              </span>
              <span
                className={`h-1 w-1 rounded-full transition-colors ${dotClass}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotPanel({ dateKey, data, loading }) {
  if (!dateKey) return null;

  const label = fromDateKey(dateKey).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mt-10 border border-ink/15 bg-surface/80 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-red">
        Time Slots
      </p>
      <h2 className="mt-1 font-display text-2xl italic text-ink">{label}</h2>

      <div className="mt-5">
        {loading ? (
          <Loader label="Loading slots" />
        ) : data?.isFullyClosed ? (
          <p className="font-body text-ash">
            {data.closureReason || "Studio closed this day."}
          </p>
        ) : data?.slots?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {data.slots.map((slot) => (
              <div
                key={slot.time}
                className={[
                  "border px-3 py-2 font-mono text-sm transition-colors",
                  slot.available
                    ? "border-ink/20 text-ink"
                    : "border-ink/8 text-ash/50 line-through",
                ].join(" ")}
              >
                {formatDisplayTime(slot.time)}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-ash">No bookable slots for this date.</p>
        )}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const {
    availabilityByDate,
    selectedDateAvailability,
    loading,
    dateLoading,
    error,
    fetchDate,
  } = useAvailability();

  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date();
  const todayKey = toDateKey(today);
  const nextMonthDate = addMonths(today, 1);

  const handleSelect = (dateKey) => {
    setSelectedDate(dateKey);
    fetchDate(dateKey);
  };

  const thisMonth = { year: today.getFullYear(), month: today.getMonth() };
  const nextMonth = {
    year: nextMonthDate.getFullYear(),
    month: nextMonthDate.getMonth(),
  };

  return (
    <section className="min-h-screen bg-bg px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Open Books</p>
        <h1 className="page-title">Availability</h1>

        {loading ? (
          <Loader label="Checking studio calendar" />
        ) : error ? (
          <div className="booking-panel text-red">
            {error.message || "Can't reach the server. Check your connection or try again in a moment."}
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="mb-8 flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
              {[
                { dot: "bg-emerald-500", label: "Available" },
                { dot: "bg-ash/40", label: "Full" },
                { dot: "bg-red/40", label: "Closed" },
              ].map(({ dot, label }) => (
                <span key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* Two-month grid */}
            <div className="grid gap-10 border border-ink/15 bg-surface/80 p-6 sm:grid-cols-2">
              <MonthCalendar
                {...thisMonth}
                availabilityByDate={availabilityByDate}
                selectedDate={selectedDate}
                todayKey={todayKey}
                onSelect={handleSelect}
              />
              <MonthCalendar
                {...nextMonth}
                availabilityByDate={availabilityByDate}
                selectedDate={selectedDate}
                todayKey={todayKey}
                onSelect={handleSelect}
              />
            </div>

            {/* Time slot panel — appears on day selection */}
            <TimeSlotPanel
              dateKey={selectedDate}
              data={selectedDateAvailability}
              loading={dateLoading}
            />
          </>
        )}

        <Button to="/booking" className="mt-8">
          Choose a Time
        </Button>
      </div>
    </section>
  );
}
