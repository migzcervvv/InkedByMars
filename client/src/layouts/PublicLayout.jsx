import { Outlet, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { PrivacyNotice } from '../components/layout/PrivacyNotice'
export function PublicLayout() {
  const [params, setParams] = useSearchParams()
  const privacyOpen = params.get('privacy') === '1'
  const setPrivacyOpen = open => {
    const next = new URLSearchParams(params)
    if (open) next.set('privacy', '1'); else next.delete('privacy')
    setParams(next, { replace: true, preventScrollReset: true })
  }
  return <div className="public-site"><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content"><Outlet /></main><Footer onPrivacy={() => setPrivacyOpen(true)} /><PrivacyNotice open={privacyOpen} onClose={() => setPrivacyOpen(false)} /></div>
}
