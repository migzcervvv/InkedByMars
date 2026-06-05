import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { InkParticles } from "../ui/InkParticles";
import { Button } from "../ui/Button";

const ease = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.15,
    },
  },
};

const lineVariants = {
  hidden: {
    y: "110%",
    opacity: 0,
  },
  show: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 1.1,
      ease,
    },
  },
};

const fadeUp = {
  hidden: {
    y: 28,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.9,
      ease,
    },
  },
};

const maskReveal = {
  hidden: {
    clipPath: "inset(100% 0 0 0)",
    scale: 1.08,
  },
  show: {
    clipPath: "inset(0% 0 0 0)",
    scale: 1,
    transition: {
      duration: 1.4,
      ease,
    },
  },
};

export function Hero() {
  const ref = useRef(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, {
    stiffness: 60,
    damping: 18,
    mass: 0.6,
  });

  const sy = useSpring(my, {
    stiffness: 60,
    damping: 18,
    mass: 0.6,
  });

  const px1 = useTransform(sx, (v) => v * 18);
  const py1 = useTransform(sy, (v) => v * 18);

  const px2 = useTransform(sx, (v) => v * -28);
  const py2 = useTransform(sy, (v) => v * -28);

  const px3 = useTransform(sx, (v) => v * 12);
  const py3 = useTransform(sy, (v) => v * 12);

  const lightBg = useTransform([sx, sy], ([x, y]) => {
    return `radial-gradient(
      600px circle at ${50 + x * 30}% ${50 + y * 30}%,
      rgb(240 232 222 / 0.18),
      transparent 60%
    )`;
  });

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      mx.set(x);
      my.set(y);
    };

    el.addEventListener("mousemove", onMove);

    return () => {
      el.removeEventListener("mousemove", onMove);
    };
  }, [mx, my]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen w-full overflow-hidden grain"
      style={{ backgroundColor: "var(--color-bg)" }}
      aria-label="InkedByMars hero"
    >
      {/* Paper texture base */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage: "paper-texture.jpg",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 paper-noise opacity-40"
        aria-hidden
      />

      {/* Mouse-follow warm light */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: lightBg,
          mixBlendMode: "soft-light",
        }}
        aria-hidden
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(26,16,8,0.55) 100%)",
        }}
        aria-hidden
      />

      <InkParticles count={16} />

      {/* Main content */}
      <div className="relative z-20 mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-10 px-6 pt-32 pb-20 md:grid-cols-12 md:px-16 md:pt-28">
        {/* Left text */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="md:col-span-7 md:pr-6"
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 flex items-center gap-3"
          >
            <span
              className="block h-px w-10"
              style={{
                backgroundColor: "var(--color-red)",
              }}
            />

            <span
              className="font-mono text-[11px] uppercase tracking-[0.4em]"
              style={{
                color: "var(--color-red-dark)",
              }}
            >
              Private Tattoo Studio
            </span>
          </motion.div>

          <h1
            className="font-display leading-[0.92] tracking-[-0.02em]"
            style={{ color: "var(--color-ink)" }}
          >
            <span className="block overflow-hidden">
              <motion.span
                variants={lineVariants}
                className="block text-[7vw] italic md:text-[5vw]"
              >
                Fine line
              </motion.span>
            </span>

            <span className="block overflow-hidden">
              <motion.span
                variants={lineVariants}
                className="block text-[7vw] md:text-[5vw]"
                style={{
                  paddingLeft: "0.18em",
                }}
              >
                Blackwork
                <span
                  className="italic"
                  style={{
                    color: "var(--color-red-dark)",
                  }}
                >
                  .
                </span>
              </motion.span>
            </span>

            <span className="block overflow-hidden">
              <motion.span
                variants={lineVariants}
                className="block text-[7vw] italic md:text-[5vw]"
                style={{
                  color: "var(--color-leather)",
                }}
              >
                Custom ink.
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-10 max-w-xl font-body text-xl italic leading-snug text-balance md:text-2xl"
            style={{
              color: "var(--color-leather)",
            }}
          >
            Fine-line, black & grey, and editorial blackwork — composed slowly,
            worn for a lifetime. Booking by curated consultation only.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <Button to="/booking">Book Now</Button>
          </motion.div>
        </motion.div>

        {/* Right images */}
        <div className="relative md:col-span-5 md:h-[78vh]">
          <div className="relative h-[80vw] max-h-[640px] w-full md:h-full">
            {/* Main portrait */}
            <motion.div
              variants={maskReveal}
              initial="hidden"
              animate="show"
              className="absolute right-0 top-0 z-10 h-[78%] w-[78%] overflow-hidden shadow-leather"
              style={{
                borderRadius: "2px",
              }}
            >
              <motion.img
                src="hero-portrait.jpg"
                alt="Tattooed editorial portrait"
                className="h-full w-full object-cover"
                style={{
                  x: px1,
                  y: py1,
                  willChange: "transform",
                }}
                draggable={false}
              />
            </motion.div>

            {/* Tattoo image */}
            <motion.div
              variants={maskReveal}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 z-20 h-[46%] w-[58%] overflow-hidden shadow-leather"
              style={{
                borderRadius: "200px 12px 12px 12px",
              }}
            >
              <motion.img
                src="hero-tattoo-1.jpg"
                alt="Tattoo close-up"
                className="h-full w-full object-cover"
                style={{
                  x: px2,
                  y: py2,
                  willChange: "transform",
                }}
                draggable={false}
              />
            </motion.div>

            {/* Hand image */}
            <motion.div
              variants={maskReveal}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.35 }}
              className="absolute -right-6 -top-8 z-30 hidden h-[30%] w-[34%] overflow-hidden shadow-red md:block"
              style={{
                borderRadius: "9999px 9999px 4px 4px",
              }}
            >
              <motion.img
                src="hero-hand.jpg"
                alt="Tattoo machine close-up"
                className="h-full w-full object-cover"
                style={{
                  x: px3,
                  y: py3,
                  willChange: "transform",
                }}
                draggable={false}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
