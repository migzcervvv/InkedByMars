import { PageIntro } from '../../components/ui/PageIntro'
import InstagramFeed from '../../components/instagram/InstagramFeed'
import { useInstagramFeed } from '../../hooks/useInstagramFeed'
import { usePageMeta } from '../../hooks/usePageMeta'
import { studio } from '../../config/studio'

export default function WorksPage() {
  const feed = useInstagramFeed()
  usePageMeta('Works', 'Tattoos, drawings, and recent pieces from Inked by Mars on Instagram. Browse photos, reels, and flash from the Las Piñas tattoo studio.')
  return <><PageIntro title="Works, in ink." aside={<a href={studio.instagram} target="_blank" rel="noreferrer" className="text-link">{feed.profile?.username ? `@${feed.profile.username}` : studio.instagramHandle}</a>}><p>Drawings that found their people.<br />The latest from my Instagram.</p></PageIntro><div className="frame works-content"><InstagramFeed {...feed} /></div><section className="works-close frame"><h2>Something in mind?</h2><p>Bring a reference or start with a drawing from the flash collection.</p><a href={studio.flashInstagram} target="_blank" rel="noreferrer" className="text-link">Explore the flash collection</a></section></>
}
