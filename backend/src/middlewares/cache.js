// In-memory cache using node-cache
// This prevents hammering the Meta API on every page load
const NodeCache = require("node-cache");
const logger = require("../utils/logger");

// Cache TTL of 5 minutes (300 seconds)
// Instagram posts don't change every second — this is a sensible default
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Express middleware that caches responses by route key.
 * Usage: router.get('/posts', cacheMiddleware('posts'), handler)
 */
function cacheMiddleware(key) {
  return (req, res, next) => {
    const cached = cache.get(key);
    if (cached) {
      logger.info("Cache HIT", { key });
      return res.json(cached);
    }
    logger.info("Cache MISS", { key });

    // Intercept res.json to store result in cache before sending
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, data);
        logger.info("Cached response", { key, ttl: 300 });
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Manually invalidate a cache key (e.g., after a webhook event)
 */
function invalidateCache(key) {
  cache.del(key);
  logger.info("Cache invalidated", { key });
}

module.exports = { cacheMiddleware, invalidateCache };
