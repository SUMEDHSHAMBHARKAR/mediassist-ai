import { ROLES, normalizeRole } from "../constants/roles";
import { api } from "./apiClient";

/**
 * Auth service connecting directly to FastAPI authentication endpoints:
 *   login       -> POST /auth/login (OAuth2 form-data)
 *   register    -> POST /auth/register
 *   refresh     -> POST /auth/refresh
 *   me          -> GET  /auth/me
 *   doctorAcc   -> POST /auth/admin/doctors
 */

export const authService = {
  async login(credentials = {}) {
    const username = credentials.user_name || credentials.identifier || credentials.username || "";
    const password = credentials.password || "";

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const tokenPair = await api.post("/auth/login", formData);

    if (tokenPair?.access_token) {
      localStorage.setItem("mediassist_access_token", tokenPair.access_token);
      if (tokenPair.refresh_token) {
        localStorage.setItem("mediassist_refresh_token", tokenPair.refresh_token);
      }
    }

    // Fetch user details from /auth/me
    const userSession = await this.me();
    return userSession;
  },

  async register(payload = {}) {
    const body = {
      // The API uses a username (not the display-name field used by the form).
      // Fall back to the local part of the email so a standard registration
      // can be completed without exposing an extra username field.
      user_name: payload.user_name || payload.identifier || payload.name || payload.email?.split("@")[0] || "",
      email: payload.email || "",
      password: payload.password || "",
    };

    const registeredUser = await api.post("/auth/register", body);

    // Auto log in after successful registration
    if (payload.password) {
      try {
        return await this.login({ user_name: body.user_name, password: body.password });
      } catch (err) {
        // Fall back to registered user object if auto-login fails
      }
    }

    return {
      ...registeredUser,
      role: normalizeRole(registeredUser.role || ROLES.PATIENT),
    };
  },

  async refresh() {
    const refreshToken = localStorage.getItem("mediassist_refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const tokenPair = await api.post("/auth/refresh", { refresh_token: refreshToken });
    if (tokenPair?.access_token) {
      localStorage.setItem("mediassist_access_token", tokenPair.access_token);
      if (tokenPair.refresh_token) {
        localStorage.setItem("mediassist_refresh_token", tokenPair.refresh_token);
      }
    }
    return tokenPair;
  },

  async me() {
    const user = await api.get("/auth/me");
    const role = normalizeRole(user.role);
    return {
      ...user,
      role,
      name: user.user_name,
    };
  },

  async createDoctorAccount(payload) {
    return await api.post("/auth/admin/doctors", payload);
  },

  logout() {
    localStorage.removeItem("mediassist_access_token");
    localStorage.removeItem("mediassist_refresh_token");
    return Promise.resolve({ ok: true });
  },

  requestPasswordReset(email) {
    return Promise.resolve({ email, sent: true });
  },

  resetPassword(token) {
    return Promise.resolve({ token, reset: true });
  },
};

export default authService;
