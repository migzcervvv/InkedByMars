// Custom hook that manages all data fetching state for the Instagram feed
// Centralizing this logic keeps components clean and reusable
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchInstagramPosts } from "../api/instagramApi";

/**
 * useInstagramFeed
 * Handles:
 *   - Initial data fetch
 *   - Pagination / infinite scroll
 *   - Loading states
 *   - Error states
 *   - Deduplication of posts
 */
export function useInstagramFeed(postsPerPage = 12) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // True on initial load
  const [loadingMore, setLoadingMore] = useState(false); // True when fetching next page
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);

  // Track seen post IDs to avoid duplicates on re-renders or rapid calls
  const seenIds = useRef(new Set());

  /**
   * Fetch a page of posts and merge into state.
   * @param {string|null} paginationCursor - null for first page
   */
  const fetchPage = useCallback(
    async (paginationCursor = null) => {
      try {
        const result = await fetchInstagramPosts(
          postsPerPage,
          paginationCursor,
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch posts");
        }

        // Deduplicate: only add posts we haven't seen before
        const newPosts = (result.data || []).filter((post) => {
          if (seenIds.current.has(post.id)) return false;
          seenIds.current.add(post.id);
          return true;
        });

        setPosts((prev) =>
          paginationCursor ? [...prev, ...newPosts] : newPosts,
        );
        setHasMore(result.pagination?.hasMore || false);
        setCursor(result.pagination?.nextCursor || null);
      } catch (err) {
        setError(err.message);
      }
    },
    [postsPerPage],
  );

  // Initial load
  useEffect(() => {
    seenIds.current = new Set(); // Reset on mount
    setLoading(true);
    setError(null);
    fetchPage(null).finally(() => setLoading(false));
  }, [fetchPage]);

  /**
   * Trigger loading the next page.
   * Safe to call multiple times — guards against concurrent calls.
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    await fetchPage(cursor);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, fetchPage]);

  /**
   * Refresh from the beginning.
   */
  const refresh = useCallback(async () => {
    seenIds.current = new Set();
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLoading(true);
    await fetchPage(null);
    setLoading(false);
  }, [fetchPage]);

  return { posts, loading, loadingMore, error, hasMore, loadMore, refresh };
}
