import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "../ui/Button";

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden border-y border-ink/10 bg-surface/40 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-red">
            Inked by Mars
          </p>

          <h2 className="mt-4 font-display text-4xl font-bold text-ink md:text-6xl">
            Ready For Your Next Piece?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-xl text-ink/75 md:text-2xl">
            Secure your consultation, discuss your concept, and reserve a
            session tailored to your vision.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button to="/booking">
              <CalendarDays className="h-4 w-4" />
              Book Now
            </Button>

            <Button to="/availability">
              <Clock3 className="h-4 w-4" />
              Check Availability
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
