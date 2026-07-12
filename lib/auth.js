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
