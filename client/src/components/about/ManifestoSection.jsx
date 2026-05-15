import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";

gsap.registerPlugin(ScrollTrigger);

export function ManifestoSection() {
  const ref = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });

    tl.from(".manifesto-eyebrow", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    })
      .from(
        ".manifesto-headline",
        { y: 64, opacity: 0, duration: 1.2, ease: "power4.out" },
        "-=0.5",
      )
      .from(
        ".manifesto-body",
        { y: 40, opacity: 0, duration: 1, ease: "power3.out" },
        "-=0.8",
      )
      .from(
        ".manifesto-ghost",
        { x: 60, opacity: 0, duration: 1.4, ease: "power3.out" },
        "<",
      );
  }, []);

  return (
    <section
      ref={ref}
      className="relative border-b border-ink/10 pt-24 px-6 py-20 md:py-28 lg:px-16 xl:py-36"
    >
      {/* Decorative ghost letterform */}
      <span
        aria-hidden="true"
        className="manifesto-ghost pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-display font-black uppercase leading-none text-ink/[0.035]"
        style={{ fontSize: "clamp(5rem, 22vw, 18rem)" }}
      >
        Mars
      </span>

      <p className="manifesto-eyebrow font-mono text-[0.65rem] uppercase tracking-[0.28em] text-red mb-8">
        About the Artist — InkedByMars — Manila PH
      </p>

      <h2
        className="manifesto-headline section-title max-w-4xl leading-[0.92] text-balance"
        style={{ fontSize: "clamp(2.4rem, 6vw, 5.5rem)" }}
      >
        Not every mark is meant
        <br />
        to be seen.{" "}
        <em className="italic text-ink/50">
          Some are
          <br />
          meant to be felt.
        </em>
      </h2>

      <p className="manifesto-body mt-8 max-w-xl font-body text-lg leading-relaxed text-ink/60 md:text-xl">
        Mars is a Manila-based tattoo artist who treats the body as a site of
        memory, mood, and meaning. Her studio is quiet, deliberate, and built
        for clients who want a mark with permanence and emotional weight.
      </p>
    </section>
  );
}
