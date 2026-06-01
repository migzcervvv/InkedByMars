const axios = require("axios");
const { getValidToken } = require("./tokenService");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

const IG_API_VERSION = process.env.IG_API_VERSION || "v25.0";
const GRAPH_HOST = (process.env.GRAPH_BASE || "https://graph.facebook.com")
  .replace(/\/+$/, "")
  .replace(/\/v\d+\.\d+$/, "");
const GRAPH_BASE = `${GRAPH_HOST}/${IG_API_VERSION}`;
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RETRIES = 2;

const postsCache = {
  data: null,
  fetchedAt: 0,
  limit: null,
};

const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
].join(",");

const PROFILE_FIELDS = [
  "id",
  "username",
  "biography",
  "profile_picture_url",
  "followers_count",
  "media_count",
  "website",
].join(",");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getSanitizedUrl(url, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "access_token") return;
    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

function shouldRetry(error) {
  if (!error.response) return true;
  return error.response.status >= 500;
}

async function graphGet(url, params) {
  const token = await getValidToken(); // get it here
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      return await axios.get(url, {
        params, // fields etc — no token here
        timeout: 8000,
        headers: {
          Authorization: `Bearer ${token}`, // token goes here
        },
      });
    } catch (error) {
      const status = error.response?.status || null;

      logger.error("Meta Graph API request failed", {
        url: getSanitizedUrl(url, params),
        status,
        responseBody: error.response?.data || null,
        attempt: attempt + 1,
      });

      if (attempt >= MAX_RETRIES || !shouldRetry(error)) {
        handleGraphApiError(error);
      }

      await sleep(1000 * 2 ** attempt);
      attempt += 1;
    }
  }

  throw new AppError("Instagram fetch failed.", 502, "IG_FETCH_FAILED");
}

function normalizePost(post) {
  return {
    id: post.id,
    caption: post.caption || "",
    mediaType: post.media_type,
    mediaUrl: post.media_url || "",
    thumbnailUrl: post.thumbnail_url || null,
    permalink: post.permalink,
    timestamp: post.timestamp,
    displayImageUrl:
      post.media_type === "VIDEO"
        ? post.thumbnail_url || post.media_url
        : post.media_url,
  };
}

function getFreshCachedPosts(limit) {
  const fresh =
    postsCache.data && Date.now() - postsCache.fetchedAt < CACHE_TTL_MS;
  if (!fresh || postsCache.limit !== limit) return null;

  logger.info("Instagram posts cache hit", {
    limit,
    fetchedAt: postsCache.fetchedAt,
  });

  return {
    ...postsCache.data,
    fromCache: true,
    fetchedAt: postsCache.fetchedAt,
  };
}

function setCachedPosts(limit, data) {
  postsCache.data = data;
  postsCache.fetchedAt = Date.now();
  postsCache.limit = limit;
}

async function getInstagramPosts(limit = 12, cursor = null) {
  if (!IG_USER_ID) {
    throw new AppError(
      "Instagram User ID is not configured.",
      500,
      "IG_MISCONFIGURED",
    );
  }
  if (!cursor) {
    const cached = getFreshCachedPosts(limit);
    if (cached) return cached;
  }

  const token = await getValidToken();
  const params = {
    fields: MEDIA_FIELDS,
    limit,
  };

  if (cursor) {
    params.after = cursor;
  }

  const url = `${GRAPH_BASE}/${IG_USER_ID}/media`;
  logger.info("Fetching Instagram posts", {
    version: IG_API_VERSION,
    limit,
    hasCursor: !!cursor,
  });

  const response = await graphGet(url, params);

  const rateLimitHeader = response.headers["x-app-usage"];
  if (rateLimitHeader) {
    const usage = JSON.parse(rateLimitHeader);
    logger.info("Meta API rate limit usage", usage);
    if (
      usage.call_count > 80 ||
      usage.total_cputime > 80 ||
      usage.total_time > 80
    ) {
      logger.warn("Approaching Meta API rate limit", usage);
    }
  }

  const { data = [], paging } = response.data;
  if (!data.length) {
    throw new AppError(
      "No Instagram posts are available right now.",
      404,
      "IG_NO_POSTS",
    );
  }

  const result = {
    posts: data.map(normalizePost),
    nextCursor: paging?.cursors?.after || null,
    hasMore: !!paging?.next,
    fromCache: false,
    fetchedAt: Date.now(),
  };

  if (!cursor) {
    setCachedPosts(limit, result);
  }

  logger.info("Instagram posts fetched", {
    count: result.posts.length,
    hasMore: result.hasMore,
  });

  return result;
}

async function getCarouselChildren(mediaId) {
  const token = await getValidToken();
  const url = `${GRAPH_BASE}/${mediaId}/children`;
  const response = await graphGet(url, {
    fields: "id,media_type,media_url,thumbnail_url",
  });

  return response.data.data;
}

async function getInstagramProfile() {
  const token = await getValidToken();
  const url = `${GRAPH_BASE}/${IG_USER_ID}`;
  const response = await graphGet(url, {
    fields: PROFILE_FIELDS,
  });

  return response.data;
}

async function getGraphMe() {
  const response = await graphGet(`${GRAPH_BASE}/me`, { fields: "id,name" });
  return response.data;
}

function getInstagramErrorCode(status, metaCode) {
  if (metaCode === 190 || status === 401) return "IG_TOKEN_EXPIRED";
  if ([4, 17, 32, 341, 613].includes(metaCode) || status === 429) {
    return "IG_RATE_LIMITED";
  }
  return "IG_FETCH_FAILED";
}

function getInstagramStatus(status, code) {
  if (code === "IG_TOKEN_EXPIRED") return 401;
  if (code === "IG_RATE_LIMITED") return 429;
  return status || 502;
}

function handleGraphApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const metaError = data?.error || {};
    const code = getInstagramErrorCode(status, metaError.code);

    throw new AppError(
      metaError.message || "Instagram could not be reached right now.",
      getInstagramStatus(status, code),
      code,
    );
  }

  throw new AppError(
    "Instagram could not be reached right now.",
    502,
    "IG_FETCH_FAILED",
  );
}

module.exports = {
  getInstagramPosts,
  getCarouselChildren,
  getInstagramProfile,
  getGraphMe,
  IG_API_VERSION,
  GRAPH_BASE,
};
