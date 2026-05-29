// Utility functions for formatting display data

/**
 * Format an ISO timestamp into a human-friendly relative or absolute date.
 * Examples: "2 days ago", "Jan 15", "Dec 5, 2023"
 */
export function formatPostDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  // Older: show actual date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Truncate a caption to a maximum character count, adding ellipsis.
 */
export function truncateCaption(caption, maxLength = 100) {
  if (!caption) return "";
  if (caption.length <= maxLength) return caption;
  return caption.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Format a count (likes, comments) in a compact way.
 * Examples: 142 → "142", 1542 → "1.5K", 1200000 → "1.2M"
 */
export function formatCount(count) {
  if (!count && count !== 0) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}
