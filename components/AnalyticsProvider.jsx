"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

if (typeof window !== "undefined") {
  initAnalytics();
}

/**
 * Starts product analytics once for the whole app. Renders no UI.
 * Page views follow App Router navigations via PostHog's history listener.
 */
export default function AnalyticsProvider({ children }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return children;
}
