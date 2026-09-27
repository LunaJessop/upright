export const AUTH_TOKEN_KEY = "upright_token";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

const RETURN_PATH_BASE = "https://upright.invalid";

function decodeReturnPath(value) {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    if (!current.includes("%")) return current;
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) return current;
      current = decoded;
    } catch {
      return null;
    }
  }
  return current;
}

/**
 * Same-site relative path only. Rejects other domains, protocol-relative
 * URLs, and backslash / userinfo tricks that some URL parsers treat as a host.
 * Returns a normalized path, or null when the value is not safe to navigate to.
 */
export function safeNextPath(value) {
  if (typeof value !== "string") return null;
  const decoded = decodeReturnPath(value.trim());
  if (!decoded) return null;
  const path = decoded.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return null;
  }
  if (/[\u0000-\u001F\u007F]/.test(path)) return null;

  const hashIndex = path.indexOf("#");
  const withoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const pathOnly = withoutHash.split("?")[0];
  if (pathOnly.includes("\\") || pathOnly.includes("@")) return null;

  let url;
  try {
    url = new URL(path, RETURN_PATH_BASE);
  } catch {
    return null;
  }
  if (url.origin !== RETURN_PATH_BASE) return null;

  const normalized = `${url.pathname}${url.search}${url.hash}`;
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return null;
  if (
    normalized === "/login" ||
    normalized.startsWith("/login/") ||
    normalized.startsWith("/login?")
  ) {
    return null;
  }
  return normalized;
}

/** Where to go after a successful sign-in. Ignores an unsafe `next`. */
export function pathAfterLogin(user, nextParam) {
  if (user?.has_read_access || user?.has_app_access) {
    return safeNextPath(nextParam) || "/items";
  }
  return "/register/plan";
}

export function loginHref(returnPath) {
  const win = globalThis.window;
  const candidate =
    returnPath ??
    (win ? `${win.location.pathname}${win.location.search || ""}` : "");
  const next = safeNextPath(candidate);
  if (!next) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

// Set when an authenticated request returns 401. Stays set until /login so a
// later shell redirect cannot send an expired session to the marketing home.
let redirectToLoginOnExpiry = false;

export function requestLoginRedirect() {
  redirectToLoginOnExpiry = true;
}

export function shouldRedirectToLogin() {
  return redirectToLoginOnExpiry;
}

export function clearLoginRedirect() {
  redirectToLoginOnExpiry = false;
}

export const ROLE_LABELS = {
  founder: "Founder",
  admin: "Admin",
  user: "User",
};

/** Higher number = more permission (founder > admin > user) */
export const ROLE_RANK = {
  founder: 3,
  admin: 2,
  user: 1,
};

/** Matches server passwordMeetsPolicy */
export function passwordMeetsPolicy(password) {
  if (typeof password !== "string" || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export const PASSWORD_POLICY_HINT =
  "At least 8 characters, one uppercase letter, and one non-alphanumeric character.";
