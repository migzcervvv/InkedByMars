import { useEffect } from 'react'
import { studio } from '../config/studio'
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = `${title} | ${studio.name}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  }, [title, description])
}
