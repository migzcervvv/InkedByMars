import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { START_YEAR } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function Milestones() {
  const ref = useRef(null);

  const yearsActive = new Date().getFullYear() - START_YEAR;

  const STATS = [
    { val: yearsActive, unit: "", lbl: "Years Active" },
    { val: "300+", unit: "", lbl: "Pieces Completed" },
    { val: "98%", unit: "", lbl: "Return Clients" },
    { val: "Manila", unit: "PH", lbl: "Studio Location" },
  ];

  useGSAP(() => {
    gsap.from(".milestone-stat", {
      y: 32,
      opacity: 0,
      duration: 0.8,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
  }, []);

  return (
    <section ref={ref} className="border-y border-ink/10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-px bg-ink/10 md:grid-cols-4">
          {STATS.map(({ val, unit, lbl }) => (
            <div
              key={lbl}
              className="milestone-stat flex flex-col items-center justify-center bg-surface px-6 py-12 text-center md:px-8 md:py-16"
            >
              <p
                className="font-display font-black text-ink"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                  lineHeight: 1,
                }}
              >
                {val}
                {unit && (
                  <span className="ml-1.5 font-mono text-sm font-normal text-red">
                    {unit}
                  </span>
                )}
              </p>
              <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/45">
                {lbl}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
