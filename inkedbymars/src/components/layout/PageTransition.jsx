import { motion } from 'framer-motion'

export function PageTransition({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0, transformOrigin: 'bottom' }}
      transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      className="min-h-screen"
    >
      <motion.div
        className="pointer-events-none fixed inset-0 z-[70] origin-bottom bg-red"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      />
      {children}
    </motion.main>
  )
}
