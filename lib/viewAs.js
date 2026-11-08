const ADMIN_TOKEN_KEY = "upright_admin_token";
const RETURN_KEY = "upright_view_as_return";

export const VIEW_AS_TOOLTIP = "Viewing as a user is read-only.";

const READ_BUTTONS = new Set([
  "previous",
  "next",
  "search",
  "apply",
  "close",
  "export csv",
]);

export function canViewAsMember(member, currentUser) {
  if (!member?.id) return false;
  if (member.is_platform_admin) return false;
  const memberEmail = String(member.email || "").trim().toLowerCase();
  const adminEmail = String(currentUser?.email || "").trim().toLowerCase();
  if (currentUser?.is_platform_admin && memberEmail && memberEmail === adminEmail) {
    return false;
  }
  return true;
}

export function viewAsReasonError(reason) {
  const text = String(reason ?? "").trim();
  if (!text) return "A reason is required.";
  if (text.length > 500) return "Keep the reason under 500 characters.";
  return null;
}

export function viewAsConfirm(member) {
  const name = member?.name || "this person";
  const email = member?.email ? ` (${member.email})` : "";
  return `View the app as ${name}${email}. You can look around, but you cannot change anything.`;
}

export function formatViewAsEnds(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "soon";
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time;
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

export function viewAsBannerText({ email, expiresAt, now = new Date() }) {
  return `Viewing as ${email} · read-only · ends ${formatViewAsEnds(expiresAt, now)}`;
}

export function viewAsExpired(expiresAt, now = Date.now()) {
  const ends = new Date(expiresAt).getTime();
  return !Number.isFinite(ends) || ends <= now;
}

function storage() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

/** Admin token stays in this tab's sessionStorage, never localStorage. */
export function stashAdminSession(token, returnTo) {
  const store = storage();
  if (!store || !token) return;
  store.setItem(ADMIN_TOKEN_KEY, token);
  store.setItem(RETURN_KEY, returnTo || "/admin");
}

export function readViewAsReturn() {
  const store = storage();
  return store?.getItem(RETURN_KEY) || "/admin";
}

export function clearViewAsStash() {
  const store = storage();
  if (!store) return;
  store.removeItem(ADMIN_TOKEN_KEY);
  store.removeItem(RETURN_KEY);
}

export function isBlockedWhileViewing(control) {
  if (!control || control.allow) return false;
  const tag = String(control.tag || "").toLowerCase();
  const type = String(control.type || "").toLowerCase();
  const text = String(control.text || "").replace(/\s+/g, " ").trim().toLowerCase();
  const href = String(control.href || "");
  if (tag === "a") {
    return /\/new(?:\/|-|$)/.test(href) || text.startsWith("add ");
  }
  if (tag === "textarea") return true;
  if (tag === "select") return false;
  if (tag === "input") {
    return !["search", "checkbox", "radio", "hidden", "button", "reset"].includes(type);
  }
  if (tag === "button") {
    if (READ_BUTTONS.has(text)) return false;
    return true;
  }
  return false;
}
