import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { IMG, CLIENT_VALUES } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function ClientPhilosophy() {
  const ref = useRef(null);

  useGSAP(() => {
    /* Studio image clip-path reveal */
    gsap.from(".philosophy-image-frame", {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: 1.4,
      ease: "power4.inOut",
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });

    /* Copy stagger */
    gsap.from(".philosophy-copy > *", {
      y: 36,
      opacity: 0,
      duration: 0.9,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 70%" },
    });
  }, [], ref);

  return (
    <section
      ref={ref}
      className="border-t border-ink/10 py-24 lg:py-36"
      style={{
        background:
          "color-mix(in srgb, var(--color-leather, #1a1208) 8%, transparent)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Studio image — clip reveal */}
          <div className="order-2 lg:order-1">
            <div className="philosophy-image-frame aspect-[4/5] overflow-hidden bg-leather">
              <img
                src={IMG.studio}
                alt="Mars working in her private studio"
                width="900"
                height="1200"
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="philosophy-copy order-1 lg:order-2">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
              The Experience
            </p>

            <h2 className="section-title mt-4 leading-tight">
              You Deserve a
              <br />
              Tattoo That Feels
              <br />
              Completely Yours
            </h2>

            <p className="mt-7 font-body text-2xl italic leading-snug text-ink">
              Mars doesn't do walk-ins, flash sheets, or rushed appointments.
            </p>

            <p className="mt-4 font-body leading-relaxed text-ink/65">
              Every booking begins with a private consultation — by appointment
              only. You'll leave the first session with a custom concept, not a
              copied reference. The design phase is collaborative, iterative,
              and completely unhurried.
            </p>

            {/* Values list */}
            <ul className="mt-9 space-y-3" aria-label="Studio commitments">
              {CLIENT_VALUES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-4 font-body text-sm text-ink/65"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-px w-5 shrink-0 bg-red"
                  />
                  {item}
                </li>
              ))}
            </ul>

            {/* Availability pill */}
            <p className="mt-10 inline-flex items-center gap-3 border border-ink/10 px-5 py-3">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-red"
              />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/50">
                Currently accepting new clients — limited slots per quarter
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
