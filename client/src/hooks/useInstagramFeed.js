import { useCallback, useEffect, useState } from "react";
import {
  fetchInstagramPosts,
  fetchInstagramProfile,
} from "../api/instagramApi";

const networkMessage =
  "Can't reach the server. Check your connection or try again in a moment.";

function getGalleryMessage(error) {
  if (!error?.status) return networkMessage;
  return "We couldn't load the gallery right now. Try refreshing — or visit our Instagram directly.";
}

export function useInstagramFeed(postsPerPage = 50) {
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSlowLoading(false);
    setError(null);

    const slowTimer = window.setTimeout(() => {
      setSlowLoading(true);
    }, 8000);

    try {
      const [postsResult, profileResult] = await Promise.allSettled([
        fetchInstagramPosts(postsPerPage),
        fetchInstagramProfile(),
      ]);

      if (postsResult.status === "rejected") {
        throw postsResult.reason;
      }

      setPosts(postsResult.value.data || []);

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data || null);
      }
    } catch (err) {
      setError({
        message: getGalleryMessage(err),
        code: err?.code || "IG_FETCH_FAILED",
      });
    } finally {
      window.clearTimeout(slowTimer);
      setLoading(false);
    }
  }, [postsPerPage]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return {
    posts,
    profile,
    loading,
    slowLoading,
    error,
    refresh: load,
  };
}
