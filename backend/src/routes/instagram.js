// Express router for all Instagram-related API endpoints
// These routes are the only thing your React frontend will ever call
const express = require("express");
const router = express.Router();
const {
  getInstagramPosts,
  getCarouselChildren,
  getInstagramProfile,
} = require("../services/instagramService");
const { cacheMiddleware } = require("../middlewares/cache");
const logger = require("../utils/logger");

/**
 * GET /api/instagram/posts
 * Query params:
 *   - limit: number of posts (default 12, max 50)
 *   - cursor: pagination cursor for next page
 *
 * Returns: { posts, nextCursor, hasMore }
 */
router.get("/posts", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 50); // Cap at 50
    const cursor = req.query.cursor || null;

    // Only cache the FIRST page (no cursor) — subsequent pages are dynamic
    if (!cursor) {
      const cacheKey = `posts_first_${limit}`;
      const { cacheMiddleware: cm } = require("../middlewares/cache");
      // Apply cache inline for first page
    }

    const result = await getInstagramPosts(limit, cursor);

    res.json({
      success: true,
      data: result.posts,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error("Error in GET /posts", {
      message: error.message,
      code: error.metaCode,
    });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/instagram/posts/cached
 * Same as /posts but with cache middleware applied.
 * Use this for initial page load — faster response.
 */
router.get(
  "/posts/cached",
  cacheMiddleware("posts_cached_12"),
  async (req, res) => {
    try {
      const result = await getInstagramPosts(12, null);

      res.json({
        success: true,
        data: result.posts,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      logger.error("Error in GET /posts/cached", { message: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/instagram/posts/:mediaId/children
 * Fetch carousel slides for a CAROUSEL_ALBUM post
 */
router.get("/posts/:mediaId/children", async (req, res) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId || !/^\d+$/.test(mediaId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid media ID" });
    }

    const children = await getCarouselChildren(mediaId);

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    logger.error("Error fetching carousel children", { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/instagram/profile
 * Fetch Instagram profile info (username, bio, follower count, etc.)
 */
router.get("/profile", cacheMiddleware("ig_profile"), async (req, res) => {
  try {
    const profile = await getInstagramProfile();

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error("Error fetching profile", { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
