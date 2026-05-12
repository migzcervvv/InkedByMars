import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { Tag } from '../ui/Tag'

export function GalleryLightbox({ posts, index, onClose, onNavigate }) {
  const post = index === null ? null : posts[index]

  useEffect(() => {
    if (!post) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onNavigate((index + 1) % posts.length)
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + posts.length) % posts.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, onNavigate, post, posts.length])

  if (!post) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 text-cream backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button type="button" aria-label="Close lightbox" onClick={onClose} className="absolute right-5 top-5 grid size-11 place-items-center border border-cream/25 transition hover:border-red hover:text-red">
          <X size={20} />
        </button>
        <button type="button" aria-label="Previous image" onClick={() => onNavigate((index - 1 + posts.length) % posts.length)} className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-cream/25 transition hover:border-red hover:text-red">
          <ChevronLeft />
        </button>
        <motion.img
          key={post.id}
          src={post.src}
          srcSet={post.srcSet}
          alt={post.alt}
          width="900"
          height="1200"
          className="max-h-[78vh] max-w-[88vw] object-contain"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          loading="eager"
          decoding="async"
        />
        <button type="button" aria-label="Next image" onClick={() => onNavigate((index + 1) % posts.length)} className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-cream/25 transition hover:border-red hover:text-red">
          <ChevronRight />
        </button>
        <div className="absolute inset-x-0 bottom-0 border-t border-cream/10 bg-ink/80 p-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl italic">{post.title}</p>
              <Tag className="mt-2 border-red bg-red text-cream">{post.style}</Tag>
            </div>
            <a href={post.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-cream/75 hover:text-red">
              Original Post <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
