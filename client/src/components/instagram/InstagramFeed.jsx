import { useEffect, useMemo, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { formatPostDate, truncateCaption } from "../../utils/formatters";
import PostCard from "./PostCard";
import SkeletonCard from "./SkeletonCard";
import "./InstagramFeed.css";

const INSTAGRAM_URL = "https://instagram.com/inkedbymars";
const FILTERS = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos" },
  { id: "reels", label: "Reels" },
  { id: "carousels", label: "Carousels" },
];

function matchesFilter(post, filter) {
  if (filter === "photos") return post.mediaType === "IMAGE";
  if (filter === "reels") return post.mediaType === "VIDEO";
  if (filter === "carousels") return post.mediaType === "CAROUSEL_ALBUM";
  return true;
}

function formatFollowers(count) {
  if (!count && count !== 0) return null;
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(count);
}

function InstagramFeed({
  posts,
  profile,
  loading,
  slowLoading,
  error,
  refresh,
}) {
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [activePost, setActivePost] = useState(null);

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesFilter(post, filter)),
    [filter, posts],
  );
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const followerCount = formatFollowers(profile?.followers_count);
  const handle = profile?.username ? `@${profile.username}` : "@inkedbymars";

  useEffect(() => {
    const firstImage = posts.find((post) => post.displayImageUrl);
    if (!firstImage) return undefined;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstImage.displayImageUrl;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [posts]);

  if (loading) {
    return (
      <section className="instagram-feed" aria-label="Loading Instagram posts">
        <GalleryHeader handle={handle} followerCount={followerCount} />
        <p className="instagram-feed__status">
          {slowLoading
            ? "Still loading — Instagram data can be slow on first visit."
            : "Loading gallery"}
        </p>
        <div className="instagram-feed__masonry" aria-busy="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="instagram-feed instagram-feed--error">
        <GalleryHeader handle={handle} followerCount={followerCount} />
        <div className="instagram-feed__notice">
          <p>{error.message}</p>
          <div className="instagram-feed__notice-actions">
            <button type="button" onClick={refresh}>
              Retry
            </button>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="instagram-feed" aria-label="Instagram posts">
      <GalleryHeader handle={handle} followerCount={followerCount} />

      <div className="instagram-feed__filters" role="tablist" aria-label="Filter posts">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? "is-active" : ""}
            onClick={() => {
              setFilter(item.id);
              setVisibleCount(9);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="instagram-feed__notice">
          <p>No posts match this filter.</p>
          <button type="button" onClick={() => setFilter("all")}>
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          <div className="instagram-feed__masonry">
            {visiblePosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                onOpen={setActivePost}
              />
            ))}
          </div>

          {visibleCount < filteredPosts.length && (
            <div className="instagram-feed__load">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 9)}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      <Lightbox post={activePost} onClose={() => setActivePost(null)} />
    </section>
  );
}

function GalleryHeader({ handle, followerCount }) {
  return (
    <header className="instagram-feed__header">
      <div>
        <p className="eyebrow">Instagram Feed</p>
        <h1 className="page-title">Gallery</h1>
        <div className="instagram-feed__meta">
          <span>{handle}</span>
          {followerCount && <span>{followerCount} followers</span>}
        </div>
      </div>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        Follow on Instagram <ExternalLink size={15} />
      </a>
    </header>
  );
}

function Lightbox({ post, onClose }) {
  useEffect(() => {
    if (!post) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, post]);

  if (!post) return null;

  const image = post.displayImageUrl || post.mediaUrl;

  return (
    <div className="instagram-lightbox" role="dialog" aria-modal="true">
      <button
        type="button"
        className="instagram-lightbox__close"
        aria-label="Close lightbox"
        onClick={onClose}
      >
        <X size={22} />
      </button>
      <div className="instagram-lightbox__content">
        <img src={image} alt={truncateCaption(post.caption, 80)} />
        <aside>
          <p className="eyebrow">{formatPostDate(post.timestamp)}</p>
          <p>{post.caption || "Instagram post"}</p>
          <a href={post.permalink} target="_blank" rel="noopener noreferrer">
            View on Instagram <ExternalLink size={15} />
          </a>
        </aside>
      </div>
    </div>
  );
}

export default InstagramFeed;
