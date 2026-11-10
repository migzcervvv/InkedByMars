import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchInstagramPosts, fetchInstagramProfile } from '../api/instagramApi'
export function useInstagramFeed(postsPerPage = 18) {
  const [result, setResult] = useState({ posts: [], profile: null, loading: true, slowLoading: false, error: null, nextCursor: null, hasMore: false, loadingMore: false, moreError: null })
  const [reload, setReload] = useState(0)
  const currentRequest = useRef(0)
  const cursorRef = useRef(null)
  const pageController = useRef(null)
  const loadingMoreRef = useRef(false)
  const refresh = useCallback(() => { currentRequest.current += 1; pageController.current?.abort(); loadingMoreRef.current = false; setResult(current => ({ ...current, loading: true, error: null, moreError: null, loadingMore: false })); setReload(value => value + 1) }, [])
  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++currentRequest.current
    const slowTimer = window.setTimeout(() => { if (!controller.signal.aborted) setResult(current => ({ ...current, slowLoading: true })) }, 8000)
    Promise.allSettled([fetchInstagramPosts(postsPerPage, null, { signal: controller.signal }), fetchInstagramProfile({ signal: controller.signal })]).then(([posts, profile]) => {
      if (controller.signal.aborted || requestId !== currentRequest.current) return
      if (posts.status === 'rejected') { setResult(current => ({ ...current, loading: false, slowLoading: false, error: posts.reason })); return }
      const data = posts.value
      cursorRef.current = data.pagination?.nextCursor || null
      setResult({ posts: data.data || [], profile: profile.status === 'fulfilled' ? profile.value.data : null, loading: false, slowLoading: false, error: null, nextCursor: cursorRef.current, hasMore: Boolean(data.pagination?.hasMore && cursorRef.current), loadingMore: false, moreError: null })
    }).finally(() => window.clearTimeout(slowTimer))
    return () => { controller.abort(); pageController.current?.abort(); window.clearTimeout(slowTimer) }
  }, [postsPerPage, reload])
  const loadMore = useCallback(async () => {
    if (!cursorRef.current || loadingMoreRef.current) return
    const requestId = currentRequest.current
    const controller = new AbortController()
    pageController.current = controller
    loadingMoreRef.current = true
    setResult(current => ({ ...current, loadingMore: true, moreError: null }))
    try {
      const data = await fetchInstagramPosts(postsPerPage, cursorRef.current, { signal: controller.signal })
      if (controller.signal.aborted || requestId !== currentRequest.current) return
      cursorRef.current = data.pagination?.nextCursor || null
      setResult(current => ({ ...current, posts: Array.from(new Map([...current.posts, ...(data.data || [])].map(post => [post.id, post])).values()), hasMore: Boolean(data.pagination?.hasMore && cursorRef.current), nextCursor: cursorRef.current, loadingMore: false }))
    } catch (error) { if (!controller.signal.aborted && requestId === currentRequest.current) setResult(current => ({ ...current, loadingMore: false, moreError: error })) }
    finally { if (requestId === currentRequest.current) loadingMoreRef.current = false }
  }, [postsPerPage])
  return { ...result, refresh, loadMore }
}
