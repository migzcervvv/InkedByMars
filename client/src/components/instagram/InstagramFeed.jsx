import { useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Loader } from '../ui/Loader'
import { Notice } from '../ui/Notice'
import { PostViewer } from '../../features/works/PostViewer'
import { studio } from '../../config/studio'
import PostCard from './PostCard'
const filters = [{ id: 'all', label: 'All work' }, { id: 'IMAGE', label: 'Photos' }, { id: 'VIDEO', label: 'Reels' }, { id: 'CAROUSEL_ALBUM', label: 'Collections' }]

export default function InstagramFeed({ posts, loading, slowLoading, error, refresh, hasMore, loadMore, loadingMore, moreError }) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)
  const filtered = useMemo(() => filter === 'all' ? posts : posts.filter(post => post.mediaType === filter), [posts, filter])
  if (loading) return <div className="feed-loading"><Loader label={slowLoading ? 'Instagram is taking a little longer…' : 'Opening the latest work'} /><div className="feed-skeleton" aria-hidden="true"><span /><span /><span /></div></div>
  if (error) return <div className="feed-unavailable"><img src="/sample.jpg" alt="Inked by Mars signed illustrated flash sheet" width="1080" height="1080" /><div><Notice title="The latest work couldn’t load." onRetry={refresh}><p>Instagram isn’t available here right now. You can still see the work and reach Mars on Instagram.</p></Notice><Button href={studio.instagram} target="_blank" rel="noreferrer">View on Instagram</Button></div></div>
  return <><div className="work-filters" role="group" aria-label="Filter Instagram media">{filters.map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><p className="sr-only" role="status">{filtered.length} posts in this selection.</p>{filtered.length ? <div className="instagram-work-grid">{filtered.map((post, index) => <PostCard key={post.id} post={post} index={index} onOpen={setActive} />)}</div> : <Notice title={posts.length ? 'Nothing in this selection yet.' : 'No work has been returned yet.'}><p>{posts.length ? 'Choose another media type, or load more work below.' : 'The full collection is available on Instagram.'}</p><Button variant="ghost" href={studio.instagram} target="_blank" rel="noreferrer">Visit Instagram</Button></Notice>}{hasMore && <div className="feed-load-more"><Button onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Opening more work…' : 'More from Instagram'}</Button></div>}{moreError && <Notice tone="error" title="More work couldn’t load." onRetry={loadMore}><p>The pieces already loaded are still available.</p></Notice>}<PostViewer post={active} onClose={() => setActive(null)} /></>
}
