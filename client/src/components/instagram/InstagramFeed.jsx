// Main feed grid component — renders the full Instagram grid
// Handles loading, error, empty, and populated states
import React, { useEffect, useRef, useCallback } from "react";
import { useInstagramFeed } from "../../hooks/useInstagramFeed";
import PostCard from "./PostCard";
import SkeletonCard from "./SkeletonCard";
import "./InstagramFeed.css";

// Number of skeleton cards to show while loading
const SKELETON_COUNT = 12;

function InstagramFeed() {
  const { posts, loading, loadingMore, error, hasMore, loadMore, refresh } =
    useInstagramFeed(12);

  // ── Infinite scroll via IntersectionObserver ──────────────────────────────
  // Observe a sentinel element at the bottom of the grid.
  // When it enters the viewport, trigger loadMore().
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loadMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "200px", // Start loading 200px before sentinel is visible
      threshold: 0,
    });

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [handleIntersect]);

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section className="instagram-feed" aria-label="Loading Instagram posts">
        <div className="instagram-feed__grid" aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="instagram-feed instagram-feed--error"
        aria-label="Error loading Instagram"
      >
        <div className="instagram-feed__error">
          <p className="instagram-feed__error-message">
            Could not load Instagram posts.
          </p>
          <p className="instagram-feed__error-detail">{error}</p>
          <button className="instagram-feed__retry-btn" onClick={refresh}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section
        className="instagram-feed instagram-feed--empty"
        aria-label="Instagram posts"
      >
        <div className="instagram-feed__empty">
          <p>No posts to display yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="instagram-feed" aria-label="Instagram posts">
      <div className="instagram-feed__grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Show skeleton cards at the bottom while loading next page */}
        {loadingMore &&
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`loading-more-${i}`} />
          ))}
      </div>

      {/* Sentinel element — triggers loadMore when it enters the viewport */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="instagram-feed__sentinel"
          aria-hidden="true"
        />
      )}

      {/* End of content message */}
      {!hasMore && posts.length > 0 && (
        <p className="instagram-feed__end-message">You're all caught up!</p>
      )}
    </section>
  );
}

export default InstagramFeed;
