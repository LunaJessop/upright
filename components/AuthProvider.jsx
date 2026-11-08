"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  endAdminImpersonation,
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  setUnauthorizedHandler,
} from "@/app/api/apiHandler";
import { identifyAnalyticsUser, resetAnalytics } from "@/lib/analytics";
import {
  clearLoginRedirect,
  getStoredToken,
  loginHref,
  setStoredToken,
} from "@/lib/auth";
import { clearViewAsStash, readViewAsReturn, viewAsExpired } from "@/lib/viewAs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [impersonating, setImpersonating] = useState(null);
  const [stoppingViewAs, setStoppingViewAs] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    clearViewAsStash();
    setUser(null);
    setImpersonating(null);
    resetAnalytics();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      const path = `${window.location.pathname}${window.location.search || ""}`;
      router.replace(loginHref(path));
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, router]);

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
      setImpersonating(session.impersonating ?? null);
      if (!session.impersonating) clearViewAsStash();
      identifyAnalyticsUser(session.user);
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
    clearLoginRedirect();
    setStoredToken(session.token);
    setUser(session.user);
    identifyAnalyticsUser(session.user);
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
      clearLoginRedirect();
      setStoredToken(session.token);
      setUser(session.user);
      identifyAnalyticsUser(session.user);
      return session;
    },
    []
  );

  const stopViewAs = useCallback(async () => {
    const returnTo = readViewAsReturn();
    setStoppingViewAs(true);
    try {
      const data = await endAdminImpersonation();
      if (!data?.token) throw new Error("Missing admin token");
      clearViewAsStash();
      setStoredToken(data.token);
      const session = await getMe();
      setUser(session.user);
      setImpersonating(null);
      identifyAnalyticsUser(session.user);
      router.push(returnTo);
    } catch {
      clearSession();
      router.replace("/login");
    } finally {
      setStoppingViewAs(false);
    }
  }, [clearSession, router]);

  useEffect(() => {
    if (!impersonating?.expires_at) return undefined;
    if (viewAsExpired(impersonating.expires_at)) {
      clearSession();
      router.replace("/login");
      return undefined;
    }
    const ends = new Date(impersonating.expires_at).getTime();
    const timer = setTimeout(() => {
      clearSession();
      router.replace("/login");
    }, Math.max(0, ends - Date.now()));
    return () => clearTimeout(timer);
  }, [impersonating, clearSession, router]);

  const logout = useCallback(() => {
    // logoutUser reads the bearer token synchronously before this clears it.
    // Do not wait on the response: a slow or failed revoke must not block logout.
    void logoutUser();
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
      impersonating,
      stopViewAs,
      stoppingViewAs,
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
      isPlatformAdmin: Boolean(user?.is_platform_admin),
      subscriptionStatus: user?.subscription_status ?? null,
      graceDaysRemaining: user?.grace_days_remaining ?? null,
    }),
    [user, impersonating, loading, login, register, logout, refreshSession, stopViewAs, stoppingViewAs]
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
