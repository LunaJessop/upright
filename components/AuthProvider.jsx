"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe, loginUser, registerUser } from "@/app/api/apiHandler";
import { getStoredToken, setStoredToken } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const session = await getMe();
      setUser(session.user);
      return session.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    const session = await loginUser(email, password);
    setStoredToken(session.token);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(
    async ({ companyName, name, email, password }) => {
      const session = await registerUser({
        companyName,
        name,
        email,
        password,
      });
      setStoredToken(session.token);
      setUser(session.user);
      return session;
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshSession,
      isAuthenticated: Boolean(user),
      hasAppAccess: Boolean(user?.has_app_access),
      hasReadAccess: Boolean(
        user?.has_read_access ?? user?.has_app_access
      ),
      canWrite: Boolean(user?.can_write ?? user?.has_app_access),
      isReadOnly: Boolean(
        user?.read_only ??
          (user?.has_read_access && !user?.has_app_access)
      ),
      subscriptionStatus: user?.subscription_status ?? null,
      graceDaysRemaining: user?.grace_days_remaining ?? null,
    }),
    [user, loading, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
