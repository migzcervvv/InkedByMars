import { useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '../../hooks/useGSAP'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  ['Ari', 'Fine Line', 'Mars made the whole process feel calm and cinematic. The linework healed beautifully.'],
  ['Sofia', 'Blackwork', 'Sharp, moody, and exactly as intense as I wanted without feeling heavy-handed.'],
  ['Camille', 'Neo-traditional', 'The color choices were unreal. It feels like a secret I get to wear.'],
]

export function Testimonials() {
  const ref = useRef(null)

  useGSAP(
    () => {
      gsap.from('.testimonial-card', {
        y: 54,
        opacity: 0,
        stagger: 0.14,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 72%' },
      })
    },
    [],
  )

  return (
    <section ref={ref} className="bg-leather py-24 text-cream lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="section-title text-cream">After The Needle</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map(([name, style, quote]) => (
            <article key={name} className="testimonial-card border border-cream/12 bg-ink/30 p-6">
              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className="size-2 rounded-full bg-red" />
                ))}
              </div>
              <p className="font-body text-3xl italic leading-tight">&ldquo;{quote}&rdquo;</p>
              <div className="mt-7 font-mono text-xs uppercase tracking-[0.18em] text-cream/65">
                {name} / {style}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
