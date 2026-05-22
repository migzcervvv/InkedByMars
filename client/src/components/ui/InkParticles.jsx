import { useMemo } from "react";

function seededParticleValue(seed, offset) {
  return (Math.sin(seed * 999 + offset * 37) + 1) / 2;
}

export function InkParticles({ count = 14 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: seededParticleValue(i + 1, 1) * 100,
        size: 2 + seededParticleValue(i + 1, 2) * 5,
        delay: seededParticleValue(i + 1, 3) * 18,
        duration: 18 + seededParticleValue(i + 1, 4) * 22,
        opacity: 0.15 + seededParticleValue(i + 1, 5) * 0.35,
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
