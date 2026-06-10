import { Link, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { formatDisplayDate } from "../utils/date";

export default function BookingConfirmationPage() {
  const { state } = useLocation();
  const booking = state?.booking;

  return (
    <section className="grid min-h-screen place-items-center bg-bg px-6 py-32 text-center">
      <div className="booking-panel max-w-2xl">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-red text-cream">
          <Check size={36} />
        </div>
        <p className="eyebrow mt-8">Booking</p>
        <h1 className="mt-3 font-display text-6xl italic leading-none text-ink">
          Hold received.
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-body text-3xl leading-tight text-ash">
          Your booking is pending.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/booking"
            className="inline-flex items-center justify-center border border-ink/20 px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
          >
            Book Another
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-red px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-cream transition hover:bg-red-dark"
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
