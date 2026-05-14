import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { INFLUENCES } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function InfluencesSection() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.from(".influence-header > *", {
      y: 30,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });

    gsap.from(".influence-item", {
      y: 40,
      opacity: 0,
      duration: 0.85,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });

    gsap.from(".influence-quote", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 60%" },
    });
  }, []);

  return (
    <section ref={ref} className="border-t border-ink/10 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="influence-header mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
              Influences
            </p>
            <h2 className="section-title mt-3 leading-none">
              What Shapes the Work
            </h2>
          </div>
          <p className="max-w-xs font-body text-sm leading-relaxed text-ink/55">
            Craft is informed by sources far outside the tattoo world.
          </p>
        </div>

        {/* Three influence pillars */}
        <div className="grid gap-0 divide-y divide-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {INFLUENCES.map(({ label, body }) => (
            <div
              key={label}
              className="influence-item px-0 py-8 md:px-10 md:py-0 md:first:pl-0 md:last:pr-0"
            >
              <p className="font-display text-xl font-black text-ink">
                {label}
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-ink/55">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* Editorial pull-quote */}
        <blockquote className="influence-quote mt-20 border-l-2 border-red pl-6 md:pl-10">
          <p className="max-w-3xl font-body text-2xl italic leading-snug text-ink/80 md:text-4xl">
            "The best tattoos are the ones you stop noticing and start
            inhabiting."
          </p>
          <cite className="mt-5 block font-mono text-[0.65rem] not-italic uppercase tracking-[0.22em] text-red/70">
            — InkedByMars
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
