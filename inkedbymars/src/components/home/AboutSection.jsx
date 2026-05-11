import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";

gsap.registerPlugin(ScrollTrigger);

const portrait = "https://picsum.photos/seed/mars-portrait/1100/1300";

export function AboutSection() {
  const ref = useRef(null);
  const startYear = 2019;
  const currentYear = new Date().getFullYear();

  const result = [(currentYear - startYear).toString(), "Years"];
  useGSAP(() => {
    gsap.from(".about-image", {
      x: -80,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 70%" },
    });
    gsap.from(".about-copy", {
      x: 80,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 70%" },
    });
  }, []);

  return (
    <section ref={ref} className="bg-surface py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
        <div className="about-image aspect-[4/5] overflow-hidden bg-leather">
          <img
            src={portrait}
            alt="InkedByMars artist portrait"
            width="1100"
            height="1300"
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </div>
        <div className="about-copy">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
            Manila / Private Studio
          </p>
          <h2 className="section-title mt-4">Skin As Editorial</h2>
          <p className="mt-6 font-body text-3xl italic leading-tight text-ink md:text-4xl">
            Mars works in fine line, blackwork, and neo-traditional pieces that
            feel intimate before they feel loud. Her studio is quiet,
            deliberate, and built for clients who want a mark with mood,
            precision, and memory.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-y border-ink/20 py-6">
            {[
              [result, " Years"],
              ["500+", "Pieces"],
              ["Manila", "PH"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-red">
                  {label}
                </p>
                <p className="mt-2 font-display text-3xl font-black text-ink">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
