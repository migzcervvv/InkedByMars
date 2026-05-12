import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { GalleryFilter } from './GalleryFilter'
import { GalleryItem } from './GalleryItem'
import { GalleryLightbox } from './GalleryLightbox'

export function GalleryGrid({ posts }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const gridRef = useRef(null)

  const filteredPosts = useMemo(
    () => (activeFilter === 'all' ? posts : posts.filter((post) => post.category === activeFilter)),
    [activeFilter, posts],
  )

  const handleFilter = (filter) => {
    if (filter === activeFilter) return
    setSelectedIndex(null)
    setActiveFilter(filter)
  }

  useEffect(() => {
    const items = gridRef.current?.querySelectorAll('[data-flip-id]') || []
    if (!items.length) return undefined

    gsap.set(items, { autoAlpha: 1, display: 'block', clearProps: 'transform' })
    gsap.fromTo(
      items,
      { y: 12, autoAlpha: 0.001 },
      { y: 0, autoAlpha: 1, stagger: 0.02, duration: 0.28, ease: 'power2.out', overwrite: true },
    )

    return () => gsap.killTweensOf(items)
  }, [activeFilter, filteredPosts.length])

  return (
    <>
      <GalleryFilter active={activeFilter} onChange={handleFilter} />
      <div ref={gridRef} className="mt-8 columns-1 gap-3 sm:columns-2 md:columns-3 lg:columns-4 md:gap-4">
        {filteredPosts.map((post, index) => (
          <GalleryItem key={post.id} post={post} onClick={() => setSelectedIndex(index)} />
        ))}
      </div>
      <GalleryLightbox posts={filteredPosts} index={selectedIndex} onClose={() => setSelectedIndex(null)} onNavigate={setSelectedIndex} />
    </>
  )
}
