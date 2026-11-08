export const ACTIVITY_TYPES = Object.freeze([
  "login",
  "login_failed",
  "password_reset_requested",
  "password_reset",
  "rate_limited",
  "error",
  "email",
  "admin_action",
]);

const ACTIVITY_LABELS = {
  login: "Sign in",
  login_failed: "Failed sign in",
  password_reset_requested: "Reset requested",
  password_reset: "Password reset",
  rate_limited: "Too many tries",
  error: "Error",
  email: "Email",
  admin_action: "Admin action",
};

export const ACTIVITY_LOG_UNAVAILABLE = "Activity logging not enabled yet";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function paging(limit, offset) {
  const limitNumber = Number(limit);
  const offsetNumber = Number(offset);
  const safeLimit =
    Number.isInteger(limitNumber) && limitNumber > 0
      ? Math.min(limitNumber, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const safeOffset =
    Number.isInteger(offsetNumber) && offsetNumber > 0 ? offsetNumber : 0;
  return { safeLimit, safeOffset };
}

function setIfPresent(params, key, value) {
  const text = value == null ? "" : String(value).trim();
  if (text) params.set(key, text);
}

/** Query string for the activity feeds. Types are comma-separated. */
export function activityQuery({ types = [], limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams();
  const chosen = (Array.isArray(types) ? types : [])
    .map((type) => String(type).trim())
    .filter((type) => ACTIVITY_TYPES.includes(type));
  if (chosen.length > 0) params.set("type", chosen.join(","));
  const { safeLimit, safeOffset } = paging(limit, offset);
  params.set("limit", String(safeLimit));
  params.set("offset", String(safeOffset));
  return params.toString();
}

/** Query string for GET /api/admin/audit. */
export function auditQuery({
  clientId = "",
  userId = "",
  adminUserId = "",
  action = "",
  limit = DEFAULT_LIMIT,
  offset = 0,
} = {}) {
  const params = new URLSearchParams();
  setIfPresent(params, "clientId", clientId);
  setIfPresent(params, "userId", userId);
  setIfPresent(params, "adminUserId", adminUserId);
  setIfPresent(params, "action", action);
  const { safeLimit, safeOffset } = paging(limit, offset);
  params.set("limit", String(safeLimit));
  params.set("offset", String(safeOffset));
  return params.toString();
}

export function activityTypeLabel(type) {
  return ACTIVITY_LABELS[type] || String(type || "—").replaceAll("_", " ");
}

export function activitySourceNotes(sources) {
  const notes = [];
  if (sources?.admin_activity === "unavailable") notes.push(ACTIVITY_LOG_UNAVAILABLE);
  if (sources?.email_log === "unavailable") notes.push("Email history is not available yet.");
  return notes;
}

export function formatInvoiceAmount(cents, currency = "usd") {
  if (cents == null || cents === "") return "—";
  const amount = Number(cents);
  if (!Number.isFinite(amount)) return "—";
  const code = String(currency || "usd").toUpperCase();
  try {
    return (amount / 100).toLocaleString("en-US", { style: "currency", currency: code });
  } catch {
    return `${(amount / 100).toFixed(2)} ${code}`;
  }
}

export function graceDaysError(days) {
  const number = Number(days);
  if (!Number.isInteger(number) || number < 1 || number > 90) {
    return "Enter a whole number of days from 1 to 90.";
  }
  return null;
}

export function isGraceNotApplicable(error) {
  return error?.status === 400 && error?.code === "GRACE_NOT_APPLICABLE";
}

function person(user) {
  const name = user?.name || "this person";
  const email = user?.email ? ` (${user.email})` : "";
  return `${name}${email}`;
}

export function passwordResetConfirm(user) {
  return `Send a password reset email to ${person(user)}. They can choose a new password from that email.`;
}

export function inviteConfirm(user) {
  return `Resend the welcome email to ${person(user)}.`;
}

export function memberActiveConfirm(user, active) {
  if (active) {
    return `Activate ${person(user)}. They will be able to sign in again.`;
  }
  return `Deactivate ${person(user)}. They will be signed out and will not be able to sign in.`;
}

export function customerActiveConfirm(customer, active) {
  const name = customer?.name || "this shop";
  if (active) return `Activate ${name}. This shop will be marked active again.`;
  return `Deactivate ${name}. People at this shop will lose access until it is activated again.`;
}

export function graceConfirm(customer, days) {
  const name = customer?.name || "this shop";
  return `Extend billing grace for ${name} by ${days} days. This only applies while the subscription is past due.`;
}
