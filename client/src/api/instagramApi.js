// Centralized Axios instance for all backend API calls
// Using an instance lets you set base URL and interceptors once
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000, // 15-second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — add any auth headers here if you add frontend auth later
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// Response interceptor — standardize error handling
api.interceptors.response.use(
  (response) => response.data, // Unwrap .data so callers get the payload directly
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Unknown error";
    return Promise.reject(new Error(message));
  },
);

// ─── Instagram API Methods ────────────────────────────────────────────────────

/**
 * Fetch Instagram posts from the backend.
 * @param {number} limit - Posts per page
 * @param {string|null} cursor - Pagination cursor
 */
export async function fetchInstagramPosts(limit = 12, cursor = null) {
  const params = { limit };
  if (cursor) params.cursor = cursor;

  // Use the cached endpoint for first page, regular for paginated pages
  const endpoint = cursor
    ? "/api/instagram/posts"
    : "/api/instagram/posts/cached";
  return api.get(endpoint, { params });
}

/**
 * Fetch carousel children for a given media ID.
 */
export async function fetchCarouselChildren(mediaId) {
  return api.get(`/api/instagram/posts/${mediaId}/children`);
}

/**
 * Fetch Instagram profile info.
 */
export async function fetchInstagramProfile() {
  return api.get("/api/instagram/profile");
}

export default api;
