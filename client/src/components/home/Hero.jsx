import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { Button } from "../ui/Button";
import { useGSAP } from "../../hooks/useGSAP";

const heroImage = "https://picsum.photos/seed/inkedbymars-hero/1800/1200";

export function Hero() {
  const scope = useRef(null);

  useGSAP(() => {
    const chars = scope.current.querySelectorAll(".hero-char");
    const timeline = gsap.timeline();
    timeline
      .from(chars, {
        yPercent: 110,
        opacity: 0,
        stagger: 0.03,
        duration: 0.9,
        ease: "power4.out",
      })
      .from(
        ".hero-subtitle",
        { y: 18, opacity: 0, duration: 0.6, ease: "power2.out" },
        "-=0.15",
      )
      .from(
        ".hero-cta",
        {
          y: 22,
          opacity: 0,
          stagger: 0.08,
          duration: 0.55,
          ease: "power2.out",
        },
        "-=0.2",
      );
    gsap.fromTo(
      ".hero-bg",
      { scale: 1.1 },
      { scale: 1, duration: 2.5, ease: "power2.out" },
    );
  }, []);

  const renderLine = (text, className) => (
    <span className={`block overflow-hidden ${className}`}>
      {text.split("").map((char, index) => (
        <span className="hero-char inline-block" key={`${char}-${index}`}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );

  return (
    <section
      ref={scope}
      className="relative flex min-h-screen items-end overflow-hidden bg-ink px-6 pb-16 pt-28 text-cream"
    >
      <picture className="absolute inset-0">
        <source srcSet={`${heroImage}?format=webp`} type="image/webp" />
        <img
          className="hero-bg size-full object-cover opacity-55 blur-[1px]"
          src={heroImage}
          width="1800"
          height="1200"
          alt="Tattoo studio mood portrait"
          decoding="async"
        />
      </picture>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(205,45,43,0.24),transparent_32%),linear-gradient(180deg,rgba(26,16,8,0.35),rgba(26,16,8,0.93))]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <p className="hero-subtitle mb-5 font-mono text-xs uppercase tracking-[0.32em] text-cream/75">
          Freehand / Customized / Minimalist
        </p>
        <h1 className="font-display leading-[0.78]">
          {renderLine(
            "INKED BY",
            "text-[16vw] italic text-cream md:text-[9vw]",
          )}
          {renderLine("MARS", "text-[18vw] font-black text-red md:text-[12vw]")}
        </h1>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button to="/gallery" variant="outline" className="hero-cta">
            View Work <ArrowRight size={16} />
          </Button>
          <Button to="/booking" className="hero-cta">
            Book Now <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}
