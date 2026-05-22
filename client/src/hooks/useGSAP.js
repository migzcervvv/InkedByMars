import { useEffect, useLayoutEffect } from 'react'
import { gsap } from 'gsap'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useGSAP(setup, deps = [], scope) {
  useIsomorphicLayoutEffect(() => {
    const context = gsap.context(setup, scope)
    return () => context.revert()
  }, deps)
}
