import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ open, onClose, children, label = 'Close modal' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={label}
            onClick={onClose}
            className="absolute right-5 top-5 grid size-11 place-items-center border border-cream/25 text-cream transition hover:border-red hover:text-red"
          >
            <X size={20} />
          </button>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
