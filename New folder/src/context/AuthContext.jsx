import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { ROLES, normalizeRole } from "../constants/roles";
import authService from "../services/authService";

/**
 * AuthContext — holds the current session and the role the UI renders for.
 *
 * IMPORTANT: this is not authentication. No credentials are verified, no token
 * is issued or stored, and no route is protected. It exists so the role-aware
 * navigation, dashboards and permissions can be reviewed before /auth/login is
 * connected. The real implementation replaces the body of `signIn` and adds
 * token persistence plus a route guard.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default to the clinician view: it exercises the most surface area.
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const signIn = useCallback(async (credentials = {}) => {
    setPending(true);
    setError(null);

    const role = normalizeRole(credentials.role || (typeof credentials === "string" ? credentials : ROLES.DOCTOR));

    try {
      const session = await authService.login({ ...credentials, role });
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

    const role = normalizeRole(payload?.role || ROLES.PATIENT);

    try {
      const session = await authService.register({ ...payload, role });
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

  /** Switch the demo role without a round trip. Removed once auth is real. */
  const switchRole = useCallback(async (rawRole) => {
    const role = normalizeRole(rawRole);
    const session = await authService.me(role);
    setUser(session);
    return session;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      pending,
      error,
      signIn,
      register,
      signOut,
      switchRole,
    }),
    [user, pending, error, signIn, register, signOut, switchRole],
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
