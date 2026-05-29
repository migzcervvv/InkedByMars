// Individual post card component
// Handles IMAGE, VIDEO (Reels), and CAROUSEL_ALBUM display
import React, { useState, useRef } from "react";
import {
  formatPostDate,
  truncateCaption,
  formatCount,
} from "../../utils/formatters";
import "./PostCard.css";

// Icons as inline SVG for zero external dependencies
const HeartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={14}
    height={14}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={14}
    height={14}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width={32} height={32}>
    <circle cx={12} cy={12} r={12} fill="rgba(0,0,0,0.5)" />
    <polygon points="10,8 16,12 10,16" fill="white" />
  </svg>
);

const CarouselIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width={18} height={18}>
    <rect x={2} y={3} width={6} height={18} rx={1} />
    <rect x={9} y={3} width={6} height={18} rx={1} />
    <rect x={16} y={3} width={6} height={18} rx={1} />
  </svg>
);

function PostCard({ post }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);

  const {
    mediaType,
    displayImageUrl,
    permalink,
    caption,
    timestamp,
    likeCount,
    commentsCount,
  } = post;

  const isVideo = mediaType === "VIDEO";
  const isCarousel = mediaType === "CAROUSEL_ALBUM";

  return (
    <article className="post-card">
      {/* Clickable image links to the Instagram post */}
      <a
        href={permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="post-card__image-link"
        aria-label={
          caption
            ? `View post: ${truncateCaption(caption, 60)}`
            : "View Instagram post"
        }
      >
        <div className="post-card__image-wrapper">
          {/* Show a low-opacity placeholder while the image loads */}
          {!imageLoaded && !imageError && (
            <div className="post-card__image-placeholder" aria-hidden="true" />
          )}

          {!imageError ? (
            <img
              ref={imgRef}
              src={displayImageUrl}
              alt={caption ? truncateCaption(caption, 60) : "Instagram post"}
              className={`post-card__image ${imageLoaded ? "post-card__image--loaded" : ""}`}
              // loading="lazy" defers off-screen images — browser handles the rest
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            // Fallback when image fails to load (URL expired, etc.)
            <div className="post-card__image-error">
              <span>Image unavailable</span>
            </div>
          )}

          {/* Overlay badge for media type */}
          <div className="post-card__badge">
            {isVideo && <PlayIcon />}
            {isCarousel && <CarouselIcon />}
          </div>

          {/* Hover overlay with like/comment counts */}
          <div className="post-card__overlay" aria-hidden="true">
            <div className="post-card__stats">
              <span className="post-card__stat">
                <HeartIcon /> {formatCount(likeCount)}
              </span>
              <span className="post-card__stat">
                <CommentIcon /> {formatCount(commentsCount)}
              </span>
            </div>
          </div>
        </div>
      </a>

      {/* Post footer with caption and date */}
      <footer className="post-card__footer">
        {caption && (
          <p className="post-card__caption">{truncateCaption(caption, 90)}</p>
        )}
        <time
          className="post-card__date"
          dateTime={timestamp}
          title={new Date(timestamp).toLocaleDateString()}
        >
          {formatPostDate(timestamp)}
        </time>
      </footer>
    </article>
  );
}

export default PostCard;
