import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { setUnauthorizedHandler } from "../api/http";
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

  const clearSession = useCallback(() => {
    clearStoredAuth();
    setAdmin(null);
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (!token) {
        setBooting(false);
        return;
      }

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

  const value = useMemo(
    () => ({
      admin,
      token,
      booting,
      isAuthenticated: Boolean(token && admin),
      role: admin?.role || null,
      login,
      logout,
      clearSession,
    }),
    [admin, booting, clearSession, login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
