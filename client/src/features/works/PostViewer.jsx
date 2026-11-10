import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchCarouselChildren } from '../../api/instagramApi'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { formatPostDate } from '../../utils/formatters'

export function PostViewer({ post, onClose }) {
  return <Dialog open={Boolean(post)} onClose={onClose} title="A piece by Mars" className="artwork-dialog">{post && <PostContent key={post.id} post={post} />}</Dialog>
}

function PostContent({ post }) {
  const [children, setChildren] = useState([])
  const [index, setIndex] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (post.mediaType !== 'CAROUSEL_ALBUM') return undefined
    const controller = new AbortController()
    fetchCarouselChildren(post.id, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setChildren(result.data || [])
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [post.id, post.mediaType])
  const images = children.length ? children : [post]
  const image = images[index]
  const isVideo = image.mediaType === 'VIDEO' || image.media_type === 'VIDEO'
  return <div className="post-viewer"><div className="post-viewer-media">{isVideo ? <video controls playsInline preload="metadata" poster={image.thumbnailUrl || image.thumbnail_url || post.displayImageUrl} src={image.mediaUrl || image.media_url}><a href={post.permalink}>View on Instagram</a></video> : <img src={image.displayImageUrl || image.mediaUrl || image.media_url} alt={image.caption || post.caption || 'Tattoo artwork by Mars'} />}{images.length > 1 && <div className="carousel-controls"><button className="icon-button" type="button" aria-label="Previous image" onClick={() => setIndex(value => (value - 1 + images.length) % images.length)}><ChevronLeft size={20} /></button><span aria-live="polite">{index + 1} of {images.length}</span><button className="icon-button" type="button" aria-label="Next image" onClick={() => setIndex(value => (value + 1) % images.length)}><ChevronRight size={20} /></button></div>}</div><div className="post-viewer-copy"><time dateTime={post.timestamp}>{formatPostDate(post.timestamp)}</time><p>{post.caption || 'From the studio.'}</p>{error && <p>More images couldn’t load. The complete post is available on Instagram.</p>}<Button href={post.permalink} target="_blank" rel="noreferrer">View on Instagram</Button></div></div>
}
