// Handles token validation, storage, and auto-refresh
// The access token is the most critical piece of infrastructure — treat it carefully
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

const TOKEN_FILE = path.join(__dirname, "../../.token-store.json");
const IG_API_VERSION = process.env.IG_API_VERSION || "v25.0";
const GRAPH_HOST = (process.env.GRAPH_BASE || "https://graph.facebook.com")
  .replace(/\/+$/, "")
  .replace(/\/v\d+\.\d+$/, "");
const GRAPH_BASE = `${GRAPH_HOST}/${IG_API_VERSION}`;

// Days before expiry to trigger a refresh (7-day buffer is safe)
const REFRESH_THRESHOLD_DAYS = 7;
let memoryTokenCache = {
  access_token: null,
  expires_at: null,
};
/**
 * Load the stored token data from disk.
 * Falls back to env var if no file exists (first run).
 */
// function loadTokenData() {
//   try {
//     if (fs.existsSync(TOKEN_FILE)) {
//       const data = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
//       return data;
//     }
//   } catch (err) {
//     logger.warn("Could not read token store file", { error: err.message });
//   }

//   // First run: use the token from environment variable
//   return {
//     access_token: process.env.META_ACCESS_TOKEN,
//     expires_at: null, // Unknown expiry — will be fetched on first validate
//   };
// }
function loadTokenData() {
  // Prefer memory cache (survives within same server instance)
  if (memoryTokenCache.access_token) return memoryTokenCache;

  // Fall back to env vars (survives cold starts if you set them)
  return {
    access_token: process.env.META_ACCESS_TOKEN,
    expires_at: process.env.INSTAGRAM_TOKEN_EXPIRES_AT
      ? Number(process.env.INSTAGRAM_TOKEN_EXPIRES_AT)
      : null,
  };
}

/**
 * Persist token data to disk so it survives server restarts.
 * In production, use a database or secret manager instead of a local file.
 */
function saveTokenData(data) {
  // Save to memory — available for the lifetime of this server instance
  memoryTokenCache = { ...data };
  // Keep the file write as a backup (nice to have, not relied on)
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    logger.warn("Could not save token to disk (non-fatal)", {
      error: err.message,
    });
  }
}

/**
 * Query Meta's debug_token endpoint to check validity and expiry.
 * The app_id|app_secret combo acts as an app access token for this endpoint.
 */
async function debugToken(token) {
  const appAccessToken = `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  const url = `${GRAPH_BASE}/debug_token`;

  const params = {
    input_token: token,
    access_token: appAccessToken,
  };
  const response = await graphTokenGet(url, params);

  return response.data.data;
}

/**
 * Exchange the current long-lived token for a fresh one.
 * Meta resets the 60-day clock on each successful exchange.
 */
async function refreshToken(currentToken) {
  const url = `${GRAPH_BASE}/oauth/access_token`;

  const response = await graphTokenGet(url, {
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    fb_exchange_token: currentToken,
  });

  const { access_token, expires_in } = response.data;
  const expiresAt = Date.now() + expires_in * 1000;

  const tokenData = { access_token, expires_at: expiresAt };
  saveTokenData(tokenData);
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
  const tokenData = loadTokenData();
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
      logger.info("Token expiry approaching, refreshing...");
      return await refreshToken(access_token);
    }
  } else {
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
      const expiresAt = info.expires_at * 1000; // Convert Unix seconds to ms
      saveTokenData({ access_token, expires_at: expiresAt });
      logger.info("Token validated on first run", {
        expiresAt: new Date(expiresAt).toISOString(),
        scopes: info.scopes,
      });
    } catch (err) {
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
    return await axios.get(url, { params });
  } catch (error) {
    const status = error.response?.status || 502;
    const metaError = error.response?.data?.error || {};
    const code =
      metaError.code === 190 || status === 400 || status === 401
        ? "IG_TOKEN_EXPIRED"
        : "IG_FETCH_FAILED";

    logger.error("Meta Graph token request failed", {
      url,
      params: sanitizeParams(params),
      status,
      responseBody: error.response?.data || null,
    });

    throw new AppError(
      metaError.message || "Instagram token validation failed.",
      code === "IG_TOKEN_EXPIRED" ? 401 : status,
      code,
    );
  }
}
