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

