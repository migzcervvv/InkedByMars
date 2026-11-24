import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useStudioMotion(scope, setCategoryId) {
  const seekStyle = useRef(null)
  useEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const stage = scope.current.querySelector('.wall-stage')
        const lead = stage.querySelector('.cell-3')
        const mosaic = gsap.timeline({
          scrollTrigger: {
            trigger: stage, start: 'top top', end: () => '+=' + innerHeight,
            pin: true, scrub: true, invalidateOnRefresh: true,
          },
        })
        mosaic.from('.wall-grid', {
          scale: () => Math.max(stage.clientWidth / lead.offsetWidth, stage.clientHeight / lead.offsetHeight),
          duration: 0.77, ease: 'power1.inOut',
        }, 0.06)
        mosaic.from('.wall-caption', { backgroundColor: 'transparent', duration: 0.4 }, 0.19)
        mosaic.from('.wall-caption h2', { clipPath: 'inset(0 100% 0 0)', duration: 0.43, ease: 'none' }, 0.23)
        mosaic.from('.wall-caption a', { autoAlpha: 0, duration: 0.2 }, 0.62)
        mosaic.to({}, { duration: 0.17 }, 0.83)

        const track = scope.current.querySelector('.style-folds')
        const panels = Array.from(track.children)
        let selected = -1
        const carousel = gsap.timeline({
          scrollTrigger: {
            trigger: track, start: 'center center', pin: true, scrub: 0.45,
            end: () => '+=' + innerHeight * 0.95 * panels.length,
            invalidateOnRefresh: true,
          },
          onUpdate() {
            const index = Math.min(panels.length - 1, Math.floor(this.time() + 0.12))
            if (selected !== index) {
              selected = index
              setCategoryId(panels[index].querySelector('button').getAttribute('aria-controls').slice(6))
            }
          },
        })
        panels.slice(1).forEach((panel, i) => {
          carousel.fromTo(panel, {
            x: () => panel.offsetWidth - panel.querySelector('button').offsetWidth,
          }, { x: 0, duration: 0.76, ease: 'sine.inOut' }, i + 0.5)
        })
        carousel.to({}, { duration: 0.74 }, panels.length - 0.74)
        seekStyle.current = index => {
          const trigger = carousel.scrollTrigger
          const progress = (index + 0.33) / panels.length
          window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start), behavior: 'smooth' })
        }
        gsap.utils.toArray('.chapter-entry').forEach(wrapper => {
          const panel = wrapper.firstElementChild
          const art = panel.querySelector('.artist-collection, .ink-booking > img')
          const chapter = gsap.timeline({
            scrollTrigger: { trigger: wrapper, start: 'top bottom', end: 'top 22%', scrub: true },
          })
          chapter.from(panel, {
            scale: 0.78, transformOrigin: 'center top', borderRadius: 32,
            duration: 1, ease: 'power1.out',
          }, 0)
          chapter.from(art, {
            clipPath: 'inset(38% 0 38% 0)', opacity: 0.2, duration: 0.65, ease: 'sine.inOut',
          }, 0.22)
        })
        gsap.utils.toArray('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 28, opacity: 0.85, duration: 0.65, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 98%', once: true } })
        })
        gsap.utils.toArray('[data-stencil]').forEach(element => {
          gsap.from(element, { scale: 0.96, rotation: element.matches('.hero-art') ? -2 : 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } })
        })
      }, scope)
      return () => { seekStyle.current = null; context.revert() }
    })
    return () => media.revert()
  }, [scope, setCategoryId])
  return (index, id) => {
    if (seekStyle.current) seekStyle.current(index)
    else setCategoryId(id)
  }
}


