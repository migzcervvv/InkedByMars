import { useRef } from 'react'

export function HeroArtwork() {
  const sheetRef = useRef(null)

  function turnSheet(event) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1))
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1))
    sheetRef.current.style.transform = `perspective(1100px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`
  }

  return <figure className="hero-art" data-stencil>
    <div className="flash-stage" onPointerMove={turnSheet} onPointerLeave={() => sheetRef.current.style.removeProperty('transform')}>
      <div className="flash-sheet" ref={sheetRef}>
        <img src="/sample.jpg" alt="Mars’s signed flash sheet of illustrated faces, flowers, ribbons and a dagger" width="1080" height="1080" fetchpriority="high" />
      </div>
    </div>
  </figure>
}
