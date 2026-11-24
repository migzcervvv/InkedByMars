import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { setHttpSessionToken, setUnauthorizedHandler } from "../api/http";
import { AuthContext } from "./AuthContextValue";
import {
  clearStoredAuth,
  getStoredAdmin,
  getStoredToken,
  setStoredAdmin,
  setStoredToken,
} from "../lib/storage";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => getStoredAdmin());
  const [token, setToken] = useState(() => getStoredToken());
  const [booting, setBooting] = useState(Boolean(getStoredToken()));

  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(() => {
    setHttpSessionToken(null);
    clearStoredAuth();
    setAdmin(null);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true);
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    function syncSession(event) {
      if (event.storageArea !== window.localStorage || getStoredToken() === token) return;
      const next = getStoredToken();
      setHttpSessionToken(next);
      setAdmin(null);
      setBooting(Boolean(next));
      setToken(next);
    }
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (!token) {
        setBooting(false);
        return;
      }

      setHttpSessionToken(token);
      try {
        const data = await authApi.me();
        if (!mounted) return;
        setAdmin(data.admin);
        setStoredAdmin(data.admin);
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setBooting(false);
      }
    }

    restore();

    return () => {
      mounted = false;
    };
  }, [clearSession, token]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setHttpSessionToken(data.token);
    setSessionExpired(false);
    setToken(data.token);
    setAdmin(data.admin);
    setStoredToken(data.token);
    setStoredAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(profile => {
    setAdmin(profile);
    setStoredAdmin(profile);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      booting,
      sessionExpired,
      isAuthenticated: Boolean(token && admin),
      role: admin?.role || null,
      login,
      logout,
      clearSession,
      updateProfile,
    }),
    [admin, booting, sessionExpired, clearSession, login, logout, token, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
