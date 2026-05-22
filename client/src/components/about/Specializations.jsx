import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { SPECIALIZATIONS } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function Specializations() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.from(".spec-header > *", {
      y: 30,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });

    gsap.from(".spec-card", {
      y: 60,
      opacity: 0,
      duration: 0.85,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });
  }, [], ref);

  return (
    <section
      ref={ref}
      className="border-t border-ink/10 py-24 lg:py-32"
      style={{
        background:
          "color-mix(in srgb, var(--color-leather, #1a1208) 8%, transparent)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="spec-header mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
              Specializations
            </p>
            <h2 className="section-title mt-3 leading-none">The Work</h2>
          </div>
          <p className="max-w-xs font-body text-sm leading-relaxed text-ink/55">
            Four disciplines. One obsession — permanence, precision, and
            emotional weight in every line.
          </p>
        </div>

        {/* Cards — flush gutter, divided by 1px background */}
        <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALIZATIONS.map(({ label, tag, image, body }) => (
            <article
              key={label}
              className="spec-card group relative flex flex-col overflow-hidden bg-surface"
            >
              {/* Image */}
              <div className="aspect-[3/4] overflow-hidden bg-leather">
                <img
                  src={image}
                  alt={`${label} tattoo style example`}
                  width="600"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
              </div>

              {/* Text info */}
              <div className="flex flex-1 flex-col p-5">
                <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-red">
                  {tag}
                </p>
                <p className="font-display text-xl font-black text-ink">
                  {label}
                </p>
                <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-ink/55">
                  {body}
                </p>
              </div>

              {/* Bottom accent line — grows on hover */}
              <div
                aria-hidden="true"
                className="h-px w-0 bg-red transition-all duration-500 group-hover:w-full"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
