export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

// Skip the SDK's own `token` property: that is the public project key and
// events are rejected without it. Everything else that looks like a secret,
// a session, or a card number is dropped before it leaves the browser.
const SENSITIVE_PROPERTY =
  /password|secret|authorization|cookie|credit[_ -]?card|card[_ -]?number|\bcvv\b|\bcvc\b/i;

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

  const next = { ...properties };
  let changed = false;

  const strip = (record) => {
    if (!record || typeof record !== "object") return record;
    const copy = { ...record };
    let innerChanged = false;
    for (const key of Object.keys(copy)) {
      if (SENSITIVE_PROPERTY.test(key)) {
        delete copy[key];
        innerChanged = true;
      }
    }
    return innerChanged ? copy : record;
  };

  for (const key of Object.keys(next)) {
    if (key === "token") continue;
    if (key === "$set" || key === "$set_once") {
      const stripped = strip(next[key]);
      if (stripped !== next[key]) {
        next[key] = stripped;
        changed = true;
      }
      continue;
    }
    if (SENSITIVE_PROPERTY.test(key)) {
      delete next[key];
      changed = true;
    }
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
