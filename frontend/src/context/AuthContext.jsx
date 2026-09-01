import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { normalizeRole } from "../constants/roles";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from token on mount
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("mediassist_access_token");
      if (token) {
        try {
          const session = await authService.me();
          setUser(session);
        } catch {
          authService.logout();
          setUser(null);
        }
      }
      setInitializing(false);
    }
    restoreSession();
  }, []);

  const signIn = useCallback(async (credentials = {}) => {
    setPending(true);
    setError(null);

    try {
      const session = await authService.login(credentials);
      setUser(session);
      return session;
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      throw cause;
    } finally {
      setPending(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setPending(true);
    setError(null);

    try {
      const session = await authService.register(payload);
      setUser(session);
      return session;
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
      throw cause;
    } finally {
      setPending(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const switchRole = useCallback(async (rawRole) => {
    const role = normalizeRole(rawRole);
    if (user) {
      setUser((prev) => (prev ? { ...prev, role } : null));
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      pending,
      initializing,
      error,
      signIn,
      register,
      signOut,
      switchRole,
    }),
    [user, pending, initializing, error, signIn, register, signOut, switchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export default AuthContext;
