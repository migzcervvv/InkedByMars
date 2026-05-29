import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { tattooStyles } from "../../data/mockGallery";
import { Button } from "../ui/Button";
import { formatDisplayDate } from "../../utils/date";
import { processImage } from "../../services/imageCompressionService";

const initial = {
  clientName: "",
  email: "",
  phone: "",
  source: "",
  tattooIdea: "",
  tattooPlacement: "",
  tattooSize: "",
  notes: "",
  references: [],
};

export function BookingForm({
  selectedDate,
  selectedSlot,
  hold,
  holdSecondsRemaining,
  onSubmit,
  submitting,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const steps = useMemo(
    () => [
      {
        label: "Your Info",
        required: ["clientName", "email", "phone", "source"],
      },
      {
        label: "Your Tattoo",
        required: ["tattooIdea", "tattooPlacement", "tattooSize"],
      },
      { label: "Review", required: [] },
    ],
    [],
  );

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    steps[step].required.forEach((field) => {
      if (!form[field]) next[field] = "Required";
    });
    if (step === 0 && form.email && !/\S+@\S+\.\S+/.test(form.email))
      next.email = "Use a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (validate()) setStep((value) => Math.min(value + 1, 2));
  };

  const setReferenceFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, 4);

    try {
      const references = await Promise.all(files.map(processImage));
      setField("references", references);
    } catch (err) {
      const references = settled
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failures = settled
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);

      if (failures.length > 0) {
        console.warn(
          "[setReferenceFiles] Some images could not be processed:",
          failures,
        );
        setErrors("uploadError", err.message);
      }
    }
  };

  const countdown = `${String(Math.floor(holdSecondsRemaining / 60)).padStart(2, "0")}:${String(holdSecondsRemaining % 60).padStart(2, "0")}`;

  if (!selectedSlot) {
    return (
      <section className="booking-panel flex min-h-[420px] items-center justify-center text-center">
        <div>
          <p className="eyebrow">Booking</p>
          <h2 className="mt-3 font-display text-5xl italic text-ink">
            Pick an open time.
          </h2>
          <p className="mx-auto mt-4 max-w-sm font-body text-2xl leading-tight text-ash">
            Available slots unlock the consultation form here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-panel">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Step {step + 1} / 3</p>
          <h2 className="mt-2 font-display text-4xl italic text-ink">
            {steps[step].label}
          </h2>
        </div>
        <p className="text-right font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ash">
          {formatDisplayDate(selectedDate)}
          <br />
          {selectedSlot}
        </p>
      </div>
      {hold && (
        <div className="mb-5 border border-[#a66a18]/40 bg-[#d49a38]/20 p-3 text-sm text-ink">
          <p className="font-semibold">
            Your booking request has been received.
          </p>
          <p className="mt-1">
            The selected time slot is temporarily reserved while waiting for
            confirmation. This reservation will expire in{" "}
            <span className="font-semibold">{countdown}</span>.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="grid gap-4"
        >
          {step === 0 && (
            <>
              <Field
                label="Full Name"
                name="clientName"
                value={form.clientName}
                error={errors.clientName}
                onChange={setField}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={setField}
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                error={errors.phone}
                onChange={setField}
              />
              <Select
                label="How did you find us?"
                name="source"
                value={form.source}
                error={errors.source}
                onChange={setField}
                options={["Instagram", "Referral", "Google", "Walk-in"]}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Select
                label="Tattoo style"
                name="tattooIdea"
                value={form.tattooIdea}
                error={errors.tattooIdea}
                onChange={setField}
                options={tattooStyles}
              />
              <Field
                label="Placement on body"
                name="tattooPlacement"
                value={form.tattooPlacement}
                error={errors.tattooPlacement}
                onChange={setField}
              />
              <Select
                label="Size estimate"
                name="tattooSize"
                value={form.tattooSize}
                error={errors.tattooSize}
                onChange={setField}
                options={[
                  ["tiny", "Tiny <5cm"],
                  ["small", "Small 5-10cm"],
                  ["medium", "Medium 10-20cm"],
                  ["large", "Large 20cm+"],
                  ["extra_large", "Extra large 20cm+"],
                  ["custom", "Custom"],
                ]}
              />
              <label className="field-label">
                Reference Images
                <span className="mt-2 flex cursor-pointer items-center gap-3 border border-ink/20 bg-cream/40 px-4 py-4 font-mono text-xs uppercase tracking-[0.14em] text-ash">
                  <Upload size={16} />{" "}
                  {form.references.length
                    ? `${form.references.length} file(s) selected`
                    : "Choose files"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setReferenceFiles(event.target.files)}
                  />
                </span>
              </label>
              {form.references.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.references.map((reference) => (
                    <img
                      key={reference.name}
                      src={reference.dataUrl}
                      alt={reference.name}
                      className="aspect-square w-full border border-ink/15 object-cover"
                    />
                  ))}
                </div>
              )}
              <label className="field-label">
                Additional notes
                <textarea
                  className="field-input min-h-28 resize-none"
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <div className="border border-ink/20 bg-cream/45 p-5">
              <p className="eyebrow">Summary</p>
              <dl className="mt-4 grid gap-3 font-body text-2xl">
                <Summary
                  label="When"
                  value={`${formatDisplayDate(selectedDate)} at ${selectedSlot}`}
                />
                <Summary label="Artist" value="InkedByMars" />
                <Summary
                  label="Client"
                  value={`${form.clientName} / ${form.email} / ${form.phone}`}
                />
                <Summary
                  label="Tattoo"
                  value={`${form.tattooIdea}, ${form.tattooSize}, ${form.tattooPlacement}`}
                />
                <Summary label="Notes" value={form.notes || "No notes added"} />
                <Summary
                  label="References"
                  value={
                    form.references.length
                      ? `${form.references.length} image(s)`
                      : "No references attached"
                  }
                />
              </dl>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-7 flex justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 0 || submitting}
          onClick={() => setStep((value) => value - 1)}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        {step < 2 ? (
          <Button variant="leather" onClick={next}>
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(form)} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Hold"}
          </Button>
        )}
      </div>
    </section>
  );
}

function Field({ label, name, type = "text", value, error, onChange }) {
  return (
    <motion.label
      animate={error ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
      className="field-label"
    >
      {label} <span className="text-red">*</span>
      <input
        className={`field-input ${error ? "border-red" : ""}`}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </motion.label>
  );
}

function Select({ label, name, value, error, onChange, options }) {
  return (
    <motion.label
      animate={error ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
      className="field-label"
    >
      {label} <span className="text-red">*</span>
      <select
        className={`field-input ${error ? "border-red" : ""}`}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      >
        <option value="">Select</option>
        {options.map((option) => {
          const value = Array.isArray(option) ? option[0] : option;
          const label = Array.isArray(option) ? option[1] : option;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <span className="field-error">{error}</span>}
    </motion.label>
  );
}

function Summary({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-red">
        {label}
      </dt>
      <dd className="mt-1 leading-tight text-ink">{value}</dd>
    </div>
  );
}
