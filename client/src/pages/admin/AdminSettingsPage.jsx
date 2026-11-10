import { useState } from "react";
import { scheduleApi } from "../../api/scheduleApi";
import { Button } from "../../components/ui/Button";
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek, toDateKey } from "../../utils/date";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    scope: "this_week",
    startDate: toDateKey(new Date()),
    endDate: toDateKey(new Date()),
    openTime: "09:00",
    closeTime: "18:00",
    reason: "Closed outside business hours",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSlots = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await scheduleApi.getByDate(form.startDate);
      setMessage(
        `${data.schedule.timeSlots.length} time slots loaded successfully.`,
      );
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await scheduleApi.applyOpeningWindow({
        ...form,
        ...resolveScopeRange(form.scope, form.startDate, form.endDate),
      });

      setMessage(
        `Business hours saved for ${data.summary.dates} day(s). ${data.summary.updatedSlots} slot updates applied. ${data.summary.skippedBookedSlots} booked slots skipped.`,
      );
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="p-5 lg:p-8">
      <div className="max-w-3xl border border-ink/10 bg-white/55 p-5">
        <p className="font-body text-xs uppercase tracking-[0.16em] text-red">
          Schedule Settings
        </p>

        <h2 className="mt-2 font-display text-4xl italic">Business Hours</h2>

        <p className="mt-3 font-body text-lg leading-relaxed text-ash">
          Set which hours customers can book appointments. Time slots inside the
          selected hours will stay open, while slots outside those hours will be
          blocked.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Apply To
            <select
              className="field-input"
              value={form.scope}
              onChange={(event) => setField("scope", event.target.value)}
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="range">Custom Date Range</option>
              <option value="forever">All Future Dates</option>
            </select>
          </label>

          <label className="field-label">
            Block Message
            <input
              className="field-input"
              value={form.reason}
              onChange={(event) => setField("reason", event.target.value)}
            />
          </label>

          <label className="field-label">
            Start Date
            <input
              className="field-input"
              type="date"
              value={form.startDate}
              onChange={(event) => setField("startDate", event.target.value)}
            />
          </label>

          <label className="field-label">
            End Date
            <input
              className="field-input"
              type="date"
              value={form.endDate}
              onChange={(event) => setField("endDate", event.target.value)}
            />
          </label>

          <label className="field-label">
            Opening Time
            <input
              className="field-input"
              type="time"
              value={form.openTime}
              onChange={(event) => setField("openTime", event.target.value)}
            />
          </label>

          <label className="field-label">
            Closing Time
            <input
              className="field-input"
              type="time"
              value={form.closeTime}
              onChange={(event) => setField("closeTime", event.target.value)}
            />
          </label>
        </div>

        {message && (
          <p className="mt-5 border border-ink/10 bg-cream/80 p-3 font-body text-xs uppercase tracking-[0.12em] text-ash">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-5 border border-red bg-red/10 p-3 font-body text-xs uppercase tracking-[0.12em] text-red">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={loadSlots} disabled={loading}>
            {loading ? "Loading..." : "Load Time Slots"}
          </Button>

          <Button onClick={apply} disabled={loading}>
            {loading ? "Saving..." : "Save Business Hours"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function resolveScopeRange(scope, startDate, endDate) {
  const today = new Date();

  if (scope === "this_week") {
    return {
      startDate: toDateKey(startOfWeek(today)),
      endDate: toDateKey(endOfWeek(today)),
    };
  }

  if (scope === "this_month") {
    return {
      startDate: toDateKey(startOfMonth(today)),
      endDate: toDateKey(endOfMonth(today)),
    };
  }

  if (scope === "forever") {
    return {
      startDate: toDateKey(today),
      endDate: toDateKey(addDays(today, 90)),
    };
  }

  return { startDate, endDate };
}
