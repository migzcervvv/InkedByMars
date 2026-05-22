import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "../../hooks/useGSAP";

gsap.registerPlugin(ScrollTrigger);

// ─── FAQ Content ──────────────────────────────────────────────────────────────

const faqSections = [
  {
    id: "general",
    label: "01",
    title: "General Questions",
    items: [
      {
        q: "Can I request for a customized tattoo?",
        a: "Of course! Customized designs usually take 2-3 days to layout so it would be better if you book ahead of time.",
      },
      {
        q: "Do you tattoo all skin tones?",
        a: "Absolutely. We have deep experience tailoring ink saturation, contrast, and design to every skin tone. Your artist will advise on what heals most vibrantly on your skin.",
      },
      {
        q: "Is the studio walk-in friendly?",
        a: "We operate by appointment only. This ensures each client receives our full attention and every piece receives the time and care it deserves.",
      },
    ],
  },
  {
    id: "booking",
    label: "02",
    title: "Booking Process",
    items: [
      {
        q: "How do I book a session?",
        a: "Submit an inquiry through our booking form with your concept, preferred placement, and reference imagery. We'll follow up within 48 hours to schedule a consultation.",
      },
      {
        q: "Do I need to pay a reservation fee?",
        a: "Yes, to confirm your appointment, you must settle your reservation fee (200php) within 24 hours. Please don't forget to send a screenshot of your payment.",
      },
      {
        q: "What should I do if I need to cancel my appointment?",
        a: "For cancelled appointments, we require at least 48 hours' notice to reschedule without penalty. Cancellations made with less than 48 hours' notice will forfeit the reservation fee.",
      },
    ],
  },
  {
    id: "preparation",
    label: "03",
    title: "Tattoo Preparation",
    items: [
      {
        q: "How should I prepare for my appointment?",
        a: "Arrive well-rested and hydrated. Eat a proper meal beforehand. Wear comfortable, loose clothing that gives easy access to the tattoo area. Avoid alcohol for 24 hours prior.",
      },
      {
        q: "Can I bring someone with me?",
        a: "One support person is welcome. We keep the studio intimate and focused — large groups disrupt the atmosphere and concentration we cultivate in our space.",
      },
      {
        q: "What should I avoid before my session?",
        a: "Avoid sunburn on the area for at least two weeks prior. Skip blood thinners unless medically necessary. Don't apply any lotions or oils on the day of your appointment.",
      },
    ],
  },
  {
    id: "aftercare",
    label: "04",
    title: "Aftercare",
    items: [
      {
        q: "What aftercare routine do you recommend?",
        a: "Keep the piece wrapped for at least 1-3 days. Once unwrapped, gently cleanse with unscented soap, pat dry, and apply a thin layer of fragrance-free moisturizer. Repeat 2–3 times daily for two weeks.",
      },
      {
        q: "Is it okay to drink alcohol before or after getting a tattoo?",
        a: "Avoid drinking alcohol for at least 2-3 days before and after your session. Alcohol thins the blood, which can lead to increased bleeding during the tattooing process and may hinder proper healing afterward.",
      },
      {
        q: "What else should I avoid during the healing process?",
        a: "You may wash your tattoo with unscented soap and gently pat it dry, but avoid soaking it in water (no swimming or baths) for at least two weeks. Also to avoid scratching, make sure to apply aloe vera gel.",
      },
    ],
  },
  {
    id: "pricing",
    label: "05",
    title: "Pricing & Deposits",
    items: [
      {
        q: "How is pricing determined?",
        a: "Pricing reflects size, complexity, placement, and session time. A full quote is provided after your consultation — no surprises on appointment day.",
      },
      {
        q: "How much is the initial price for a tattoo?",
        a: "The starting price is around 1000php for 1x1 to 1.5x1.5 inches tattoos, additional costs per inch is 300php and an additional 100php per color used for colored designs.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept cash, card, and bank transfer. Remaining balance is due on the day of your session.",
      },
    ],
  },
  {
    id: "custom",
    label: "06",
    title: "Custom Designs",
    items: [
      {
        q: "Do you create fully custom pieces?",
        a: "Yes! We create fully custom pieces. Each layout design will be depending on the complexity and size of your design. Simple pieces can take 1-2 days, while larger or more intricate designs may require up to a week. We prioritize quality and detail, so we appreciate your patience as we craft your unique tattoo.",
      },
      {
        q: "What if I want changes to the design on the day?",
        a: "Minor adjustments are always possible. Major revisions may require rescheduling. The more detailed your consultation brief, the smoother the design process.",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FAQ() {
  const ref = useRef(null);

  // Track open state separately via ref (for toggle logic) and state (for renders)
  const openItemsRef = useRef({});
  const [openItems, setOpenItems] = useState({});
  const contentRefs = useRef({});

  const registerContent = useCallback((key) => (el) => {
    if (el) {
      contentRefs.current[key] = el;
    } else {
      delete contentRefs.current[key];
    }
  }, []);

  useEffect(() => {
    const refs = contentRefs.current;
    return () => {
      gsap.killTweensOf(Object.values(refs));
    };
  }, []);

  const toggleItem = useCallback((key) => {
    const contentEl = contentRefs.current[key];
    if (!contentEl) return;

    gsap.killTweensOf(contentEl);

    const isOpen = openItemsRef.current[key];
    openItemsRef.current[key] = !isOpen;

    if (isOpen) {
      gsap.to(contentEl, {
        height: 0,
        opacity: 0,
        duration: 0.38,
        ease: "power3.inOut",
      });
    } else {
      // scrollHeight gives full height even when element is height:0 + overflow:hidden
      const fullHeight = contentEl.scrollHeight;
      gsap.fromTo(
        contentEl,
        { height: 0, opacity: 0 },
        { height: fullHeight, opacity: 1, duration: 0.48, ease: "power3.out" },
      );
    }

    setOpenItems((prev) => ({ ...prev, [key]: !isOpen }));
  }, []);

  useGSAP(() => {
    // ── Hero entrance ──
    gsap.from(".faq-eyebrow", {
      x: -18,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
    });
    gsap.from(".faq-headline", {
      y: 44,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: 0.12,
    });
    gsap.from(".faq-subline", {
      y: 22,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.26,
    });

    // ── Sections stagger in on scroll ──
    gsap.utils.toArray(".faq-section").forEach((section) => {
      gsap.from(section, {
        y: 32,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none none",
        },
      });
    });

    // ── Ghost number parallax ──
    gsap.utils.toArray(".faq-ghost-num").forEach((num) => {
      gsap.to(num, {
        y: -28,
        ease: "none",
        scrollTrigger: {
          trigger: num.closest(".faq-section"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    // ── Ambient orb drift ──
    gsap.to(".faq-orb-a", {
      y: -44,
      x: 18,
      duration: 7,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    gsap.to(".faq-orb-b", {
      y: 36,
      x: -22,
      duration: 10,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 2.5,
    });
  }, [], ref);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-leather py-24 text-cream lg:py-36"
    >
      {/* ── Atmospheric blobs ── */}
      <div className="faq-orb-a pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-red/[0.045] blur-[140px]" />
      <div className="faq-orb-b pointer-events-none absolute -bottom-32 -left-64 h-[720px] w-[720px] rounded-full bg-ink/75 blur-[120px]" />

      <div className="relative mx-auto max-w-3xl px-6">
        {/* ══ Hero Header ════════════════════════════════════════════════════ */}
        <header className="mb-20 lg:mb-24">
          {/* Eyebrow */}
          <div className="faq-eyebrow mb-5 flex items-center gap-3">
            <div className="h-px w-7 bg-red" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-red/75">
              Studio FAQ and Policies
            </span>
          </div>

          {/* Main title — matches section-title class from brand */}
          <h2 className="faq-headline section-title text-cream leading-none">
            Questions,
            <br />
            <span className="italic">Answered.</span>
          </h2>

          {/* Subline */}
          <p className="faq-subline mt-7 max-w-[260px] font-body leading-relaxed text-cream/40">
            Everything you need to know before your first needle touches skin.
          </p>
        </header>

        {/* ══ FAQ Sections ════════════════════════════════════════════════════ */}
        <div className="space-y-14">
          {faqSections.map((section) => (
            <div key={section.id} className="faq-section relative">
              {/* Ghost number — large decorative BG numeral */}
              <div
                aria-hidden="true"
                className="faq-ghost-num pointer-events-none absolute -right-2 -top-8 select-none font-mono text-[8rem] font-bold leading-none text-cream/[0.022] lg:-right-10"
              >
                {section.label}
              </div>

              {/* Section header row */}
              <div className="mb-5 flex items-center gap-3 border-b border-cream/[0.09] pb-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-red/60">
                  {section.label}
                </span>
                {/* Thin divider pip */}
                <span
                  className="size-[3px] rounded-full bg-cream/10"
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/38">
                  {section.title}
                </span>
              </div>

              {/* Accordion items */}
              <div className="flex flex-col gap-px">
                {section.items.map((item, index) => {
                  const key = `${section.id}-${index}`;
                  const isOpen = openItems[key];

                  return (
                    <article
                      key={key}
                      className="group border border-cream/[0.06] bg-ink/[0.22] backdrop-blur-[2px] transition-colors duration-300 hover:bg-ink/[0.33]"
                    >
                      {/* Question row — touch-friendly target */}
                      <button
                        onClick={() => toggleItem(key)}
                        aria-expanded={Boolean(isOpen)}
                        className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left md:px-6 md:py-[22px]"
                      >
                        <span className="font-body text-[15px] leading-snug text-cream/78 transition-colors duration-200 group-hover:text-cream md:text-base">
                          {item.q}
                        </span>

                        {/* Plus / minus icon in red — same accent as testimonial dots */}
                        <span
                          aria-hidden="true"
                          className="relative mt-[4px] size-[13px] shrink-0"
                        >
                          {/* Horizontal bar — always visible */}
                          <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-red" />
                          {/* Vertical bar — collapses when open */}
                          <span
                            className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-red transition-transform duration-300"
                            style={{
                              transform: isOpen
                                ? "translateX(-50%) scaleY(0)"
                                : "translateX(-50%) scaleY(1)",
                            }}
                          />
                        </span>
                      </button>

                      {/* Answer — height animated by GSAP, not CSS */}
                      <div
                        ref={registerContent(key)}
                        style={{ height: 0, opacity: 0, overflow: "hidden" }}
                        role="region"
                        aria-hidden={!isOpen}
                      >
                        <div className="border-t border-cream/[0.07] px-5 pb-6 pt-4 md:px-6">
                          <p className="font-body text-sm leading-relaxed text-cream/48 md:text-[15px]">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ══ Footer CTA — mirrors testimonial dot motif ════════════════════ */}
        <div className="mt-20 border border-cream/[0.08] bg-ink/[0.14] p-10 text-center">
          {/* Three red dots — same as the 5-dot star row in testimonials */}
          <div className="mb-5 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-red/60" />
            ))}
          </div>

          <p className="font-body text-xl italic text-cream/58">
            Still have questions?
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cream/28">
            Reach out — we answer every inquiry personally
          </p>
        </div>
      </div>
    </section>
  );
}
