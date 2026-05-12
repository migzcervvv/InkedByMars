import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'

export function useGSAP(setup, deps = []) {
  useLayoutEffect(() => {
    const context = gsap.context(setup)
    return () => context.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
