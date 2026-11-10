import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useStudioMotion(scope) {
  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('[data-hero-line]', { y: 30, opacity: 0.25, stagger: 0.09, duration: 0.8, ease: 'power3.out' })
        gsap.from('.flash-stage', { y: 24, duration: 1.1, ease: 'power3.out' })
        gsap.to('.flash-stage', { yPercent: -5, rotation: 2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 } })
        gsap.utils.toArray('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 28, opacity: 0.85, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 98%', once: true } })
        })
        gsap.utils.toArray('[data-stencil]').forEach(element => {
          gsap.from(element, { scale: 0.96, rotation: element.matches('.hero-art') ? -2 : 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } })
        })
      }, scope)
      return () => context.revert()
    })
    return () => media.revert()
  }, [scope])
}
