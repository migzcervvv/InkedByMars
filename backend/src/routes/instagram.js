const express = require("express");
const {
  getInstagramPosts,
  getCarouselChildren,
  getInstagramProfile,
  getGraphMe,
} = require("../services/instagramService");
const AppError = require("../utils/AppError");

const router = express.Router();

router.get("/posts", async (req, res, next) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 50);
    const cursor = req.query.cursor || null;
    const result = await getInstagramPosts(limit, cursor);

    res.set("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: result.posts,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
      cache: {
        fromCache: result.fromCache,
        fetchedAt: result.fetchedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:mediaId/children", async (req, res, next) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId || !/^\d+$/.test(mediaId)) {
      throw new AppError("Invalid media ID.", 400, "INVALID_MEDIA_ID");
    }

    const children = await getCarouselChildren(mediaId);

    res.json({
      success: true,
      data: children,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await getInstagramProfile();

    res.set("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const me = await getGraphMe();

    res.json({
      success: true,
      data: me,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
