import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { PROCESS } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function CreativeProcess() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.from(".process-left > *", {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });

    gsap.from(".process-step", {
      x: -36,
      opacity: 0,
      duration: 0.85,
      stagger: 0.13,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });
  }, [], ref);

  return (
    <section ref={ref} className="border-t border-ink/10 py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-[0.55fr_1fr] lg:gap-28">
          {/* Left — sticky heading */}
          <div className="process-left lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
              Creative Process
            </p>
            <h2 className="section-title mt-4 leading-none">
              From
              <br />
              Concept
              <br />
              to Skin
            </h2>
            <p className="mt-6 font-body text-sm leading-relaxed text-ink/55">
              The ritual matters as much as the result. Every booking moves
              through four deliberate stages — no shortcuts, no exceptions.
            </p>
          </div>

          {/* Right — numbered steps */}
          <div className="divide-y divide-ink/10">
            {PROCESS.map(({ n, title, body }) => (
              <div
                key={n}
                className="process-step group py-8 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-6">
                  <span className="mt-0.5 shrink-0 font-mono text-[0.6rem] text-red/50">
                    {n}
                  </span>
                  <div>
                    <p className="font-display text-2xl font-black text-ink transition-colors duration-300 group-hover:text-red md:text-3xl">
                      {title}
                    </p>
                    <p className="mt-2 font-body leading-relaxed text-ink/60">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
