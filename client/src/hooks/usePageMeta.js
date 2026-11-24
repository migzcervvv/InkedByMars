import { useEffect } from 'react'
import { siteOrigin } from '../config/seo.js'
import { studio } from '../config/studio'
export function usePageMeta(title, description, { noIndex = false, canonicalPath } = {}) {
  useEffect(() => {
    document.title = `${title} | ${studio.name}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)

    document.querySelector('link[rel="canonical"]')?.remove()
    document.querySelector('meta[property="og:url"]')?.remove()
    if (canonicalPath) {
      const url = new URL(canonicalPath, siteOrigin).href
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = url
      const socialUrl = document.createElement('meta')
      socialUrl.setAttribute('property', 'og:url')
      socialUrl.content = url
      document.head.append(canonical, socialUrl)
    }

    if (!noIndex) return
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.append(robots)
    return () => robots.remove()
  }, [title, description, noIndex, canonicalPath])
}
