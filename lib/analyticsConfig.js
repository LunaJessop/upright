export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

// Skip the SDK's own top-level `token` property: that is the public project
// key and events are rejected without it. Everything else that looks like a
// secret, a session, or a card number is dropped before it leaves the browser.
// A password-reset link puts the secret in the query string (`?token=`), so
// URL values are redacted too. Nested `token` keys are secrets, not the project key.
const SENSITIVE_PROPERTY =
  /password|secret|authorization|cookie|credit[_ -]?card|card[_ -]?number|\bcvv\b|\bcvc\b/i;

const SENSITIVE_QUERY_KEY =
  /^(?:token|password|secret|code|reset_token|access_token|refresh_token)$/i;

const SENSITIVE_QUERY_IN_TEXT =
  /(?:[?&#])(?:token|password|secret|code|reset_token|access_token|refresh_token)=/i;

/**
 * Replace secret query params in a URL or in a string that contains one.
 * Other params are kept. Strings with no secret param are returned as-is.
 */
export function redactSensitiveUrl(value) {
  if (typeof value !== "string" || !SENSITIVE_QUERY_IN_TEXT.test(value)) return value;
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(value);
    const url = new URL(value, absolute ? undefined : "https://placeholder.local");
    let changed = false;
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEY.test(key)) {
        url.searchParams.set(key, "redacted");
        changed = true;
      }
    }
    if (url.hash.length > 1 && SENSITIVE_QUERY_IN_TEXT.test(`?${url.hash.slice(1)}`)) {
      const hash = new URLSearchParams(url.hash.slice(1));
      for (const key of [...hash.keys()]) {
        if (SENSITIVE_QUERY_KEY.test(key)) {
          hash.set(key, "redacted");
          changed = true;
        }
      }
      url.hash = hash.toString();
    }
    if (!changed) return value;
    if (!absolute) return `${url.pathname}${url.search}${url.hash}`;
    return url.toString();
  } catch {
    return value.replace(
      /([?&#](?:token|password|secret|code|reset_token|access_token|refresh_token)=)[^&#]*/gi,
      "$1redacted"
    );
  }
}

function redactTree(value) {
  if (typeof value === "string") return redactSensitiveUrl(value);
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((entry) => {
      const redacted = redactTree(entry);
      if (redacted !== entry) changed = true;
      return redacted;
    });
    return changed ? next : value;
  }
  if (!value || typeof value !== "object") return value;

  let changed = false;
  const next = {};
  for (const key of Object.keys(value)) {
    if (key === "token" || SENSITIVE_PROPERTY.test(key) || SENSITIVE_QUERY_KEY.test(key)) {
      changed = true;
      continue;
    }
    const redacted = redactTree(value[key]);
    next[key] = redacted;
    if (redacted !== value[key]) changed = true;
  }
  return changed ? next : value;
}

export function analyticsConfig(env) {
  // Next only inlines NEXT_PUBLIC_* when the code reads process.env.NAME
  // directly. Passing process.env around leaves the key undefined in the browser.
  const source = env ?? {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
  const key =
    typeof source.NEXT_PUBLIC_POSTHOG_KEY === "string"
      ? source.NEXT_PUBLIC_POSTHOG_KEY.trim()
      : "";
  if (!key) return null;

  const hostValue =
    typeof source.NEXT_PUBLIC_POSTHOG_HOST === "string"
      ? source.NEXT_PUBLIC_POSTHOG_HOST.trim()
      : "";
  const apiHost = (hostValue || DEFAULT_POSTHOG_HOST).replace(/\/+$/, "");

  return {
    key,
    options: {
      api_host: apiHost,
      autocapture: true,
      capture_pageview: "history_change",
      capture_pageleave: true,
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
      },
      before_send: withoutSensitiveProperties,
    },
  };
}

/**
 * Person properties for posthog.identify. Email is included only when the
 * client already has it. Passwords, tokens, and payment fields are never copied.
 */
export function identifyProperties(user) {
  if (user == null || user.id == null || user.id === "") return null;
  const properties = {};
  if (typeof user.email === "string" && user.email.trim()) {
    properties.email = user.email.trim();
  }
  return {
    distinctId: String(user.id),
    properties,
  };
}

export function withoutSensitiveProperties(event) {
  if (!event || typeof event !== "object") return event;
  const properties = event.properties;
  if (!properties || typeof properties !== "object") return event;

  const next = {};
  let changed = false;

  for (const key of Object.keys(properties)) {
    // PostHog's project key. Reset tokens travel in URLs and nested fields.
    if (key === "token") {
      next[key] = properties[key];
      continue;
    }
    if (SENSITIVE_PROPERTY.test(key) || SENSITIVE_QUERY_KEY.test(key)) {
      changed = true;
      continue;
    }
    const redacted = redactTree(properties[key]);
    next[key] = redacted;
    if (redacted !== properties[key]) changed = true;
  }

  if (!changed) return event;
  return { ...event, properties: next };
}

/** posthog-js's package shape differs between the bundler and Node. */
export function posthogClientFrom(moduleNamespace) {
  const candidates = [
    moduleNamespace?.posthog,
    moduleNamespace?.default,
    moduleNamespace?.default?.posthog,
    moduleNamespace?.default?.default,
    moduleNamespace,
  ];
  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate.init === "function" &&
        typeof candidate.capture === "function"
    ) ?? null
  );
}
