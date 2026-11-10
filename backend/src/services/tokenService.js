// Handles token validation, storage, and auto-refresh
// The access token is the most critical piece of infrastructure — treat it carefully
const axios = require("../bindings/http");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { normalizeTokenExpiry } = require('../utils/tokenExpiry');

const apiVersion = () => require('../bindings/runtime').env().IG_API_VERSION || "v25.0";
const graphBase = () => ((require('../bindings/runtime').env().GRAPH_BASE || "https://graph.facebook.com")
  .replace(/\/+$/, "")
  .replace(/\/v\d+\.\d+$/, "")) + "/" + apiVersion();

// Days before expiry to trigger a refresh (7-day buffer is safe)
const REFRESH_THRESHOLD_DAYS = 7;
// Introspection is advisory during an upstream outage. Media endpoints still
// authorize every actual request; never invent an expiry or mark a token valid.
const INSPECTION_RETRY_MS = 60 * 1000;
let inspectionRetryAfter = 0;
let refreshRetryAfter = 0;
let memoryTokenCache = {
  access_token: null,
  expires_at: null,
};
async function loadTokenData() {
  // Prefer memory cache (survives within same server instance)
  if (memoryTokenCache.access_token) return memoryTokenCache;

  const stored = await require('../bindings/credentials').load();
  if (stored?.access_token) { memoryTokenCache = stored; return stored; }
  // Fall back to env vars (survives cold starts if you set them)
  return {
    access_token: require('../bindings/runtime').env().META_ACCESS_TOKEN,
    expires_at: normalizeTokenExpiry(require('../bindings/runtime').env().INSTAGRAM_TOKEN_EXPIRES_AT),
  };
}

/**
 * Persist encrypted token data in MongoDB when an encryption key is configured.
 * No filesystem storage is used by the Worker.
 */
async function saveTokenData(data) {
  memoryTokenCache = { ...data };
  await require('../bindings/credentials').save(data);
}

/**
 * Query Meta's debug_token endpoint to check validity and expiry.
 * The app_id|app_secret combo acts as an app access token for this endpoint.
 */
async function debugToken(token) {
  const appAccessToken = `${require('../bindings/runtime').env().META_APP_ID}|${require('../bindings/runtime').env().META_APP_SECRET}`;
  const url = `${graphBase()}/debug_token`;

  const params = {
    input_token: token,
    access_token: appAccessToken,
  };
  const response = await graphTokenGet(url, params);

  return response.data.data;
}

/**
 * Attempt the Facebook token exchange supported by Meta.
 * Renewal is not guaranteed; use the actual expiry returned by Meta.
 */
async function refreshToken(currentToken) {
  const url = `${graphBase()}/oauth/access_token`;

  const response = await graphTokenGet(url, {
    grant_type: "fb_exchange_token",
    client_id: require('../bindings/runtime').env().META_APP_ID,
    client_secret: require('../bindings/runtime').env().META_APP_SECRET,
    fb_exchange_token: currentToken,
  });

  const { access_token, expires_in } = response.data;
  const expiresAt = Date.now() + expires_in * 1000;

  const tokenData = { access_token, expires_at: expiresAt };
  await saveTokenData(tokenData);
  logger.info("Token refreshed successfully", {
    expiresAt: new Date(expiresAt).toISOString(),
  });

  return access_token;
}

/**
 * Get the current valid access token.
 * Automatically refreshes if within REFRESH_THRESHOLD_DAYS of expiry.
 * Call this at the start of any service function that needs the token.
 */
async function getValidToken() {
  const tokenData = await loadTokenData();
  const { access_token, expires_at } = tokenData;

  if (!access_token) {
    throw new AppError(
      "No Instagram access token found.",
      401,
      "IG_TOKEN_EXPIRED",
    );
  }

  // Check if we know the expiry and if we are approaching it
  if (expires_at) {
    const daysUntilExpiry = (expires_at - Date.now()) / (1000 * 60 * 60 * 24);
    logger.info("Token expiry check", {
      daysUntilExpiry: daysUntilExpiry.toFixed(1),
    });

    if (daysUntilExpiry < 0) {
      // Token is expired — cannot auto-refresh, manual re-auth needed
      throw new AppError(
        "Access token has expired. Please re-authenticate via OAuth to generate a new token.",
        401,
        "IG_TOKEN_EXPIRED",
      );
    }

    if (daysUntilExpiry < REFRESH_THRESHOLD_DAYS) {
      if (Date.now() < refreshRetryAfter) return access_token;
      logger.info("Token expiry approaching, refreshing...");
      try {
        const refreshedToken = await refreshToken(access_token);
        refreshRetryAfter = 0;
        return refreshedToken;
      } catch (error) {
        if (error.code !== 'IG_UPSTREAM_UNAVAILABLE' || expires_at <= Date.now()) throw error;
        refreshRetryAfter = Date.now() + INSPECTION_RETRY_MS;
        logger.warn('Meta token exchange is temporarily unavailable; using the current token until its actual expiry.');
        return access_token;
      }
    }
  } else {
    if (Date.now() < inspectionRetryAfter) return access_token;
    // First run: validate token to populate expiry info
    try {
      const info = await debugToken(access_token);
      if (!info.is_valid) {
        throw new AppError(
          "Access token is invalid. Please re-authenticate.",
          401,
          "IG_TOKEN_EXPIRED",
        );
      }
      const expiresAt = normalizeTokenExpiry(info.expires_at);
      inspectionRetryAfter = 0;
      await saveTokenData({ access_token, expires_at: expiresAt });
      logger.info("Token validated on first run", {
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        scopes: info.scopes,
      });
    } catch (err) {
      if (err.code === 'IG_UPSTREAM_UNAVAILABLE') {
        inspectionRetryAfter = Date.now() + INSPECTION_RETRY_MS;
        logger.warn('Meta token inspection is temporarily unavailable; data requests will authorize the token directly.');
        return access_token;
      }
      logger.error("Token validation failed", { error: err.message });
      throw err;
    }
  }

  return access_token;
}

module.exports = { getValidToken, refreshToken, debugToken };

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      key.includes("token") || key.includes("secret") ? "[redacted]" : value,
    ]),
  );
}

async function graphTokenGet(url, params) {
  try {
    return await axios.get(url, { params, timeout: 10000 });
  } catch (error) {
    const status = error.response?.status || 502;
    const metaError = error.response?.data?.error || {};
    const unavailable = status >= 500 || metaError.is_transient === true || metaError.code === 2;
    const code =
      metaError.code === 190 || status === 401
        ? "IG_TOKEN_EXPIRED"
        : unavailable ? 'IG_UPSTREAM_UNAVAILABLE' : "IG_FETCH_FAILED";

    logger.error("Meta Graph token request failed", {
      url,
      params: sanitizeParams(params),
      status,
      responseBody: error.response?.data || null,
      transport: { name: error.name, code: error.code || null, causeCode: error.cause?.code || null, upstreamStatus: error.upstreamStatus || null },
    });

    throw new AppError(
      metaError.message || "Instagram token validation failed.",
      code === "IG_TOKEN_EXPIRED" ? 401 : unavailable ? 502 : status,
      code,
    );
  }
}
