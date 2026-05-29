// Core service: all Meta Graph API calls live here
// The route handler should NEVER call axios directly — always go through this service
const axios = require("axios");
const { getValidToken } = require("./tokenService");
const logger = require("../utils/logger");

const GRAPH_BASE = process.env.GRAPH_BASE;
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;

// Fields to request for each media item
// thumbnail_url is only populated for VIDEO type — safe to request for all types
const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "like_count",
  "comments_count",
].join(",");

/**
 * Fetch a paginated list of Instagram media posts.
 *
 * @param {number} limit - Number of posts per page (max 100, default 12)
 * @param {string|null} cursor - Pagination cursor (null for first page)
 * @returns {{ posts: Array, nextCursor: string|null, hasMore: boolean }}
 */
async function getInstagramPosts(limit = 12, cursor = null) {
  const token = await getValidToken();

  const params = {
    fields: MEDIA_FIELDS,
    limit,
    access_token: token,
  };

  // Only include 'after' cursor if paginating
  if (cursor) {
    params.after = cursor;
  }

  try {
    const url = `${GRAPH_BASE}/${IG_USER_ID}/media`;
    logger.info("Fetching Instagram posts", { limit, hasCursor: !!cursor });

    const response = await axios.get(url, { params });

    // Log rate limit info from response headers
    const rateLimitHeader = response.headers["x-app-usage"];
    if (rateLimitHeader) {
      const usage = JSON.parse(rateLimitHeader);
      logger.info("Meta API rate limit usage", usage);
      // Warn if approaching limit (> 80% usage)
      if (
        usage.call_count > 80 ||
        usage.total_cputime > 80 ||
        usage.total_time > 80
      ) {
        logger.warn("Approaching Meta API rate limit", usage);
      }
    }

    const { data, paging } = response.data;

    // Extract the next page cursor from the paging object
    const nextCursor = paging?.cursors?.after || null;
    const hasMore = !!paging?.next; // 'next' only exists if there is another page

    // Normalize the data: add a display-friendly date, set default values
    const posts = data.map((post) => ({
      id: post.id,
      caption: post.caption || "",
      mediaType: post.media_type, // 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
      mediaUrl: post.media_url || "",
      thumbnailUrl: post.thumbnail_url || null,
      permalink: post.permalink,
      timestamp: post.timestamp,
      likeCount: post.like_count || 0,
      commentsCount: post.comments_count || 0,
      // Determine the display image: use thumbnail for videos, media_url for images
      displayImageUrl:
        post.media_type === "VIDEO"
          ? post.thumbnail_url || post.media_url
          : post.media_url,
    }));

    logger.info("Instagram posts fetched", { count: posts.length, hasMore });
    return { posts, nextCursor, hasMore };
  } catch (error) {
    handleGraphApiError(error);
  }
}

/**
 * Fetch carousel children for a CAROUSEL_ALBUM post.
 * Returns the individual slides/images in a carousel.
 *
 * @param {string} mediaId - ID of the CAROUSEL_ALBUM post
 */
async function getCarouselChildren(mediaId) {
  const token = await getValidToken();

  try {
    const url = `${GRAPH_BASE}/${mediaId}/children`;
    const response = await axios.get(url, {
      params: {
        fields: "id,media_type,media_url,thumbnail_url",
        access_token: token,
      },
    });

    return response.data.data;
  } catch (error) {
    handleGraphApiError(error);
  }
}

/**
 * Fetch the Instagram profile/account info.
 * Useful for displaying follower count, bio, profile picture.
 */
async function getInstagramProfile() {
  const token = await getValidToken();

  try {
    const url = `${GRAPH_BASE}/${IG_USER_ID}`;
    const response = await axios.get(url, {
      params: {
        fields:
          "id,username,biography,profile_picture_url,followers_count,media_count,website",
        access_token: token,
      },
    });

    return response.data;
  } catch (error) {
    handleGraphApiError(error);
  }
}

/**
 * Centralized Graph API error handler.
 * Translates Meta's error codes into meaningful messages.
 *
 * Meta error code reference:
 * https://developers.facebook.com/docs/graph-api/guides/error-handling
 */
function handleGraphApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const metaError = data?.error || {};

    logger.error("Meta Graph API error", {
      status,
      code: metaError.code,
      message: metaError.message,
      type: metaError.type,
      fbtrace: metaError.fbtrace_id,
    });

    // Common Meta error codes
    const errorMessages = {
      190: "Access token is invalid or expired. Please re-authenticate.",
      100: "Invalid parameter. Check your request fields and IDs.",
      200: "Permission error. This permission has not been granted.",
      4: "Too many API calls. Rate limit exceeded.",
      341: "Feed request limit reached. Try again later.",
      10: "Application does not have permission for this action.",
    };

    const friendlyMessage =
      errorMessages[metaError.code] ||
      metaError.message ||
      "Unknown Meta API error";

    const err = new Error(friendlyMessage);
    err.statusCode = status;
    err.metaCode = metaError.code;
    throw err;
  }

  // Network error or other non-HTTP error
  logger.error("Non-HTTP error calling Meta API", { error: error.message });
  throw new Error(`Failed to reach Meta API: ${error.message}`);
}

module.exports = {
  getInstagramPosts,
  getCarouselChildren,
  getInstagramProfile,
};
