import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "../ui/Button";
import { formatDisplayDate } from "../../utils/date";

export function BookingConfirmation({ booking, onAnother }) {
  return (
    <motion.section
      className="booking-panel flex min-h-[560px] items-center justify-center text-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className="max-w-md">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-red text-cream">
          <Check size={36} />
        </div>
        <h2 className="mt-6 font-display text-6xl italic text-ink">
          Hold received.
        </h2>
        <p className="mt-6 font-body text-3xl leading-tight text-ash">
          Your booking is reserved at {formatDisplayDate(booking.preferredDate)}{" "}
          at {booking.preferredTime}. This slot is reserved temporarily until
          our artist confirms. Thank you!
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="ghost" onClick={onAnother}>
            Book Another
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
