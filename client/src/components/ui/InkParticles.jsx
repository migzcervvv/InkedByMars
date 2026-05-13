import { useMemo } from "react";

export function InkParticles({ count = 14 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 18,
        duration: 18 + Math.random() * 22,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [count],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-leather"
          style={{
            left: `${p.left}%`,
            bottom: "-10vh",
            width: p.size,
            height: p.size,
            backgroundColor: "var(--color-leather)",
            opacity: p.opacity,
            filter: "blur(1px)",
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
