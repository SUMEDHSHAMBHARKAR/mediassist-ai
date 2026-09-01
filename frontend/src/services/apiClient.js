/**
 * apiClient — the single place HTTP will happen.
 *
 * Nothing in the UI calls fetch directly. Today the domain services resolve
 * mock fixtures instead of calling this client, but the client is written and
 * exported now so switching a service over is a one-line change:
 *
 *   // before
 *   return resolve(patients);
 *   // after
 *   return api.get("/patients");
 *
 * Auth token handling, error normalisation and base URL resolution all live
 * here rather than being repeated per domain.
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api";

/** Token accessor defaults to reading from localStorage. */
let tokenProvider = () => localStorage.getItem("mediassist_access_token");

export function setTokenProvider(provider) {
  tokenProvider = provider;
}

/** Normalised error so UI error states can rely on a stable shape. */
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.code = code ?? "unknown_error";
    this.details = details ?? null;
  }
}

let isRefreshing = false;

async function request(path, { method = "GET", body, params, responseType, signal, headers, _isRetry = false } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const token = tokenProvider();
  const isFormData = body instanceof FormData;
  const isUrlSearchParams = body instanceof URLSearchParams;
  const isCustomBody = isFormData || isUrlSearchParams;

  let response;

  try {
    response = await fetch(url.toString(), {
      method,
      signal,
      headers: {
        ...(isCustomBody ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: isCustomBody ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    // Network-level failure: no response at all.
    throw new ApiError("Could not reach the server.", {
      code: "network_error",
      details: cause?.message,
    });
  }

  if (response.status === 401 && !_isRetry && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh")) {
    const refreshToken = localStorage.getItem("mediassist_refresh_token");
    if (refreshToken && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          if (tokenData.access_token) {
            localStorage.setItem("mediassist_access_token", tokenData.access_token);
            if (tokenData.refresh_token) {
              localStorage.setItem("mediassist_refresh_token", tokenData.refresh_token);
            }
            isRefreshing = false;
            return request(path, { method, body, params, responseType, signal, headers, _isRetry: true });
          }
        }
      } catch (err) {
        // refresh failed
      } finally {
        isRefreshing = false;
      }
    }
  }

  if (response.status === 204) return null;

  if (responseType === "blob") {
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new ApiError(errText || "Failed to download file.", {
        status: response.status,
      });
    }
    return response.blob();
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detailMsg = Array.isArray(payload?.detail)
      ? payload.detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
      : payload?.detail;
    throw new ApiError(
      detailMsg || payload?.message || payload?.error?.message || "The request failed.",
      {
        status: response.status,
        code: payload?.code || payload?.error?.code,
        details: payload,
      },
    );
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export { BASE_URL };
export default api;
