import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return undefined }
    const scroll = () => { const target = document.getElementById(decodeURIComponent(hash.slice(1))); if (!target) return false; target.scrollIntoView({ block: 'start', behavior: 'instant' }); return true }
    if (scroll()) return undefined
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect() })
    observer.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname, hash])
  return null
}
