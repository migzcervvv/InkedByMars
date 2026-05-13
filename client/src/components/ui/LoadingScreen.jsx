import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  useMotionValue,
  useSpring,
  motion,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState("intro");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handle = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", handle);
    return () => window.removeEventListener("pointermove", handle);
  }, [mx, my]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("name"), 1400);
    const start = performance.now();
    const duration = 3200;
    let raf = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out
      const eased = 1 - Math.pow(1 - p, 2.2);
      setProgress(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("exit");
        setTimeout(() => {
          setShow(false);
          onComplete();
        }, 1300);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      clearTimeout(t1);
      cancelAnimationFrame(raf);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] grain overflow-hidden"
          style={{ background: "var(--color-ink)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          {/* Mouse follow glow */}
          <motion.div
            className="pointer-events-none absolute h-[40rem] w-[40rem] rounded-full"
            style={{
              x: sx,
              y: sy,
              translateX: "-50%",
              translateY: "-50%",
              background:
                "radial-gradient(circle, rgba(var(--color-red-rgb), 0.35) 0%, transparent 60%)",
              filter: "blur(40px)",
              mixBlendMode: "screen",
            }}
          />

          {/* Top meta strip */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(var(--color-cream-rgb),0.6)] sm:px-10">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              EST · MMXV — Atelier
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="hidden sm:inline"
            >
              N° 001 / Volume I
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Now Loading
            </motion.span>
          </div>

          {/* Center stage */}
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Ink bleed circle behind */}
            <motion.div
              className="absolute h-[28rem] w-[28rem] rounded-full sm:h-[40rem] sm:w-[40rem]"
              style={{
                background:
                  "radial-gradient(circle, var(--color-red) 0%, rgba(var(--color-red-rgb), 0.35) 35%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 0, filter: "blur(60px)" }}
              animate={{
                scale: phase === "exit" ? 8 : 1,
                opacity: phase === "exit" ? 0 : 0.55,
                filter: phase === "exit" ? "blur(0px)" : "blur(40px)",
              }}
              transition={{
                duration: phase === "exit" ? 1.1 : 1.8,
                ease: [0.7, 0, 0.2, 1],
              }}
            />

            {/* Wordmark */}
            <div className="relative flex flex-col items-center px-6 text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-4 font-mono text-[10px] uppercase tracking-[0.5em] text-[var(--color-red)]"
              >
                — Tattoo · Atelier —
              </motion.div>

              <div className="relative overflow-hidden">
                <motion.h1
                  className="font-display text-[18vw] font-light leading-[0.85] text-[var(--color-cream)] sm:text-[12vw] md:text-[10rem] lg:text-[12rem]"
                  initial={{ y: "110%", skewY: 8 }}
                  animate={{ y: "0%", skewY: 0 }}
                  transition={{
                    delay: 0.4,
                    duration: 1.2,
                    ease: [0.2, 0.9, 0.2, 1],
                  }}
                >
                  <span className="inline-block">Inked</span>
                </motion.h1>
              </div>

              <div className="-mt-2 flex items-baseline gap-3 overflow-hidden sm:gap-5">
                <motion.span
                  className="font-display text-[10vw] italic text-[var(--color-red)] sm:text-[6vw] md:text-6xl lg:text-7xl"
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    delay: 0.9,
                    duration: 1,
                    ease: [0.2, 0.9, 0.2, 1],
                  }}
                >
                  by
                </motion.span>

                <div className="overflow-hidden">
                  <motion.span
                    className="font-display text-[18vw] font-light leading-[0.85] text-[var(--color-cream)] sm:text-[12vw] md:text-[10rem] lg:text-[12rem]"
                    initial={{ y: "110%", skewY: -8 }}
                    animate={{ y: "0%", skewY: 0 }}
                    transition={{
                      delay: 1,
                      duration: 1.2,
                      ease: [0.2, 0.9, 0.2, 1],
                    }}
                  >
                    Mars
                  </motion.span>
                </div>
              </div>

              {/* Hairline */}
              <motion.div
                className="mt-10 h-px w-full max-w-md bg-[rgba(var(--color-cream-rgb),0.3)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: 1.6,
                  duration: 1.2,
                  ease: [0.7, 0, 0.2, 1],
                }}
                style={{ transformOrigin: "left" }}
              />

              {/* Counter row */}
              <div className="mt-6 flex w-full max-w-md items-center justify-between font-mono text-[11px] uppercase tracking-[0.3em] text-[rgba(var(--color-cream-rgb),0.7)]">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.6 }}
                >
                  Loading Vision
                </motion.span>

                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.6 }}
                  className="tabular-nums text-[var(--color-red)]"
                >
                  {String(progress).padStart(3, "0")} / 100
                </motion.span>
              </div>
            </div>

            {/* Side vertical text */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 -rotate-90 font-mono text-[10px] uppercase tracking-[0.5em] text-[rgba(var(--color-cream-rgb),0.4)] md:block"
            >
              Skin · Ink · Soul
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 rotate-90 font-mono text-[10px] uppercase tracking-[0.5em] text-[rgba(var(--color-cream-rgb),0.4)] md:block"
            >
              Vol. I — A Study in Permanence
            </motion.div>
          </div>

          {/* Marquee bottom */}
          <div className="absolute inset-x-0 bottom-10 overflow-hidden border-y border-[rgba(var(--color-cream-rgb),0.15)] py-3">
            <div className="animate-marquee flex gap-12 whitespace-nowrap font-display text-2xl italic text-[rgba(var(--color-cream-rgb),0.7)] sm:text-3xl">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="flex items-center gap-12">
                  Fine Line <span className="text-[var(--color-red)]">✱</span>
                  Blackwork <span className="text-[var(--color-red)]">✱</span>
                  Neo-Traditional{" "}
                  <span className="text-[var(--color-red)]">✱</span>
                  Custom Pieces{" "}
                  <span className="text-[var(--color-red)]">✱</span>
                </span>
              ))}
            </div>
          </div>

          {/* Bottom progress bar */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-5 sm:px-10">
            <div className="relative h-px w-full bg-[rgba(var(--color-cream-rgb),0.15)]">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[var(--color-red)]"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />

              <motion.div
                className="absolute -top-2 h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-[var(--color-red)]"
                style={{
                  left: `${progress}%`,
                  boxShadow: "0 0 20px rgba(var(--color-red-rgb), 0.8)",
                }}
              />
            </div>
          </div>

          {/* Curtain exit */}
          <motion.div
            className="pointer-events-none absolute inset-0 origin-bottom"
            style={{ background: "var(--color-bg)" }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase === "exit" ? 1 : 0 }}
            transition={{
              duration: 1,
              ease: [0.85, 0, 0.15, 1],
              delay: phase === "exit" ? 0.3 : 0,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
