import * as posthogModule from "posthog-js";
import {
  analyticsConfig,
  identifyProperties,
  posthogClientFrom,
  withoutSensitiveProperties,
} from "./analyticsConfig.js";

let initAttempted = false;

function client() {
  return posthogClientFrom(posthogModule);
}

/**
 * Start PostHog when a project key is configured. Missing keys (local dev,
 * preview deploys) are a no-op. Failures are swallowed so analytics cannot
 * take down a page.
 */
export function initAnalytics() {
  if (typeof window === "undefined") return false;
  const posthog = client();
  if (!posthog) return false;
  if (initAttempted || posthog.__loaded) return Boolean(posthog.__loaded);
  initAttempted = true;

  const config = analyticsConfig();
  if (!config) return false;

  try {
    posthog.init(config.key, {
      ...config.options,
      before_send: withoutSensitiveProperties,
    });
    return Boolean(posthog.__loaded);
  } catch {
    return false;
  }
}

export function identifyAnalyticsUser(user) {
  try {
    initAnalytics();
    const posthog = client();
    if (!posthog?.__loaded) return;
    const identity = identifyProperties(user);
    if (!identity) return;
    const properties =
      identity.properties && Object.keys(identity.properties).length > 0
        ? identity.properties
        : undefined;
    posthog.identify(identity.distinctId, properties);
  } catch {
    // Analytics must never break sign-in.
  }
}

export function resetAnalytics() {
  try {
    const posthog = client();
    if (!posthog?.__loaded) return;
    posthog.reset();
  } catch {
    // Analytics must never break sign-out.
  }
}

/** Safe custom event. Does nothing when PostHog was not started. */
export function captureAnalyticsEvent(eventName, properties) {
  try {
    initAnalytics();
    const posthog = client();
    if (!posthog?.__loaded) return;
    if (typeof eventName !== "string" || !eventName.trim()) return;
    posthog.capture(eventName.trim(), properties);
  } catch {
    // Analytics must never break the action that triggered the event.
  }
}
