import {
  Clapperboard,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Play,
} from "lucide-react";
import { formatPostDate, truncateCaption } from "../../utils/formatters";
import "./PostCard.css";

function getTypeLabel(mediaType) {
  if (mediaType === "VIDEO") return "Reel";
  if (mediaType === "CAROUSEL_ALBUM") return "Carousel";
  return "Photo";
}

function TypeIcon({ mediaType }) {
  if (mediaType === "VIDEO") return <Clapperboard size={16} />;
  if (mediaType === "CAROUSEL_ALBUM") return <Images size={16} />;
  return <ImageIcon size={16} />;
}

function PostCard({ post, index, onOpen }) {
  const image = post.displayImageUrl || post.thumbnailUrl || post.mediaUrl;
  const isVideo = post.mediaType === "VIDEO";
  const typeLabel = getTypeLabel(post.mediaType);
  const shape = ["tall", "wide", "square"][index % 3];

  const content = (
    <>
      <img
        src={image}
        alt={post.caption ? truncateCaption(post.caption, 80) : typeLabel}
        className="post-card__image"
        loading={index === 0 ? "eager" : "lazy"}
        decoding="async"
      />
      <span className="post-card__type" aria-label={typeLabel}>
        <TypeIcon mediaType={post.mediaType} />
      </span>
      {isVideo && (
        <span className="post-card__play" aria-hidden="true">
          <Play size={34} fill="currentColor" />
        </span>
      )}
      <span className="post-card__overlay">
        <span className="post-card__overlay-top">
          <span>
            <TypeIcon mediaType={post.mediaType} /> {typeLabel}
          </span>
          <time dateTime={post.timestamp}>{formatPostDate(post.timestamp)}</time>
        </span>
        <span className="post-card__caption">
          {truncateCaption(post.caption || "Instagram post", 80)}
        </span>
        <span className="post-card__external">
          View on Instagram <ExternalLink size={14} />
        </span>
      </span>
    </>
  );

  if (isVideo) {
    return (
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className={`post-card post-card--${shape}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`post-card post-card--${shape}`}
      onClick={() => onOpen(post)}
    >
      {content}
    </button>
  );
}

export default PostCard;
