// Loading skeleton that mimics the shape of a PostCard
// Shown during initial load — dramatically improves perceived performance
import React from "react";
import "./SkeletonCard.css";

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {/* The pulsing animation is defined in SkeletonCard.css */}
      <div className="skeleton-image" />
      <div className="skeleton-footer">
        <div className="skeleton-line skeleton-line--short" />
        <div className="skeleton-line skeleton-line--long" />
      </div>
    </div>
  );
}

export default SkeletonCard;
