import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";
import { IMG, START_YEAR } from "../../data/data";

gsap.registerPlugin(ScrollTrigger);

export function PortraitBio() {
  const ref = useRef(null);

  const yearsActive = new Date().getFullYear() - START_YEAR;

  useGSAP(() => {
    /* Clip-path reveal on the portrait frame */
    gsap.from(".portrait-bio-frame", {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: 1.5,
      ease: "power4.inOut",
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });

    /* Parallax drift on the inner image */
    gsap.to(".portrait-bio-img", {
      yPercent: -12,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });

    /* Copy stagger */
    gsap.from(".portrait-bio-copy > *", {
      y: 36,
      opacity: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 68%" },
    });

    /* Floating badge slide-in */
    gsap.from(".portrait-bio-badge", {
      x: -24,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.6,
      scrollTrigger: { trigger: ref.current, start: "top 72%" },
    });
  }, [], ref);

  return (
    <section ref={ref} className="py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:px-12 xl:gap-28">
        {/* Portrait column */}
        <div className="relative mb-12 lg:mb-0">
          <div className="portrait-bio-frame aspect-[3/4] overflow-hidden bg-leather">
            <img
              src={IMG.portrait}
              alt="InkedByMars — Mars, tattoo artist, Manila"
              width="1100"
              height="1400"
              loading="lazy"
              decoding="async"
              className="portrait-bio-img size-full scale-[1.12] object-cover object-top"
            />
          </div>

          {/* Floating studio badge */}
          <div className="portrait-bio-badge absolute bottom-5 left-5 border border-ink/10 bg-surface/90 px-5 py-4 backdrop-blur-sm">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-red">
              Private Studio
            </p>
            <p className="mt-1 font-display text-base font-black text-ink">
              Manila, Philippines
            </p>
          </div>
        </div>

        {/* Copy column */}
        <div className="portrait-bio-copy flex flex-col justify-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-red">
            The Artist
          </p>

          <h2 className="section-title mt-4 leading-none">
            Skin As
            <br />
            Editorial
          </h2>

          <p className="mt-7 font-body text-2xl italic leading-snug text-ink md:text-3xl">
            Intimate before it's loud. Deliberate before it's beautiful.
          </p>

          <div className="mt-5 space-y-4 font-body leading-relaxed text-ink/65">
            <p>
              Mars works in fine line, blackwork, and neo-traditional — styles
              chosen for how they age as much as how they look. She trained
              under three artists across Manila and Osaka before opening her
              private studio in {START_YEAR}.
            </p>
            <p>
              Every consultation is unhurried. Every design is drawn to
              disappear into its wearer — not to announce itself, but to belong
              completely. No templates. No flash. No second opinions on your
              skin.
            </p>
          </div>

          {/* Inline stat strip */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-y border-ink/15 py-7">
            {[
              [yearsActive, "Years Active"],
              ["300+", "Pieces"],
              ["Manila", "Based In"],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-red">
                  {lbl}
                </p>
                <p className="mt-2 font-display text-3xl font-black text-ink md:text-4xl">
                  {val}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
