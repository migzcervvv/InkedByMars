import { Images, Play } from 'lucide-react'
import { formatPostDate, truncateCaption } from '../../utils/formatters'
export default function PostCard({ post, index, onOpen }) {
  const image = post.displayImageUrl || post.thumbnailUrl || post.mediaUrl
  const isVideo = post.mediaType === 'VIDEO'
  return <figure className="instagram-work"><button type="button" className="instagram-artwork" onClick={() => onOpen(post)} aria-label={`Open ${truncateCaption(post.caption || 'tattoo artwork by Mars', 100)}`}><img src={image} alt={truncateCaption(post.caption || 'Tattoo artwork by Mars', 140)} width="1080" height="1350" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />{isVideo && <span className="media-indicator"><Play size={20} />Reel</span>}{post.mediaType === 'CAROUSEL_ALBUM' && <span className="media-indicator"><Images size={20} />Collection</span>}</button><figcaption><p>{truncateCaption(post.caption || 'From the studio.', 100)}</p><time dateTime={post.timestamp}>{formatPostDate(post.timestamp)}</time></figcaption></figure>
}
