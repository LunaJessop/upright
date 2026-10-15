import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_POSTHOG_HOST,
  analyticsConfig,
  identifyProperties,
  posthogClientFrom,
  withoutSensitiveProperties,
} from "./analyticsConfig.js";

describe("analyticsConfig", () => {
  it("skips setup when the project key is missing", () => {
    assert.equal(analyticsConfig({}), null);
    assert.equal(analyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "   " }), null);
    assert.equal(analyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: null }), null);
  });

  it("uses the US cloud host when no host is set", () => {
    const config = analyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "phc_test" });
    assert.equal(config.key, "phc_test");
    assert.equal(config.options.api_host, DEFAULT_POSTHOG_HOST);
    assert.equal(config.options.autocapture, true);
    assert.equal(config.options.capture_pageview, "history_change");
    assert.equal(config.options.capture_pageleave, true);
    assert.equal(config.options.disable_session_recording, false);
    assert.equal(config.options.session_recording.maskAllInputs, true);
  });

  it("reads the public env vars when no object is passed", () => {
    const previousKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const previousHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_from_env";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com/";
    try {
      const config = analyticsConfig();
      assert.equal(config.key, "phc_from_env");
      assert.equal(config.options.api_host, "https://eu.i.posthog.com");
    } finally {
      if (previousKey == null) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      else process.env.NEXT_PUBLIC_POSTHOG_KEY = previousKey;
      if (previousHost == null) delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      else process.env.NEXT_PUBLIC_POSTHOG_HOST = previousHost;
    }
  });

  it("honors a custom host and trims surrounding slashes", () => {
    const config = analyticsConfig({
      NEXT_PUBLIC_POSTHOG_KEY: " phc_eu ",
      NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com/",
    });
    assert.equal(config.key, "phc_eu");
    assert.equal(config.options.api_host, "https://eu.i.posthog.com");
  });
});

describe("identifyProperties", () => {
  it("sends the user id and email already on the client", () => {
    assert.deepEqual(
      identifyProperties({ id: 42, email: "alex@example.com", name: "Alex" }),
      { distinctId: "42", properties: { email: "alex@example.com" } }
    );
  });

  it("omits email, passwords, and tokens when they are not a plain email", () => {
    assert.deepEqual(identifyProperties({ id: "user-1" }), {
      distinctId: "user-1",
      properties: {},
    });
    assert.deepEqual(
      identifyProperties({
        id: 7,
        email: "  ",
        password: "Password1!",
        token: "secret",
      }),
      { distinctId: "7", properties: {} }
    );
  });

  it("does nothing without an id", () => {
    assert.equal(identifyProperties(null), null);
    assert.equal(identifyProperties({ email: "alex@example.com" }), null);
    assert.equal(identifyProperties({ id: "" }), null);
  });
});

describe("withoutSensitiveProperties", () => {
  it("keeps the project token and drops passwords and card data", () => {
    const event = {
      event: "$pageview",
      properties: {
        token: "phc_public",
        $current_url: "https://app.example/items",
        password: "Password1!",
        card_number: "4242",
        $set: { email: "alex@example.com", password: "nope" },
      },
    };
    const cleaned = withoutSensitiveProperties(event);
    assert.equal(cleaned.properties.token, "phc_public");
    assert.equal(cleaned.properties.$current_url, "https://app.example/items");
    assert.equal(cleaned.properties.password, undefined);
    assert.equal(cleaned.properties.card_number, undefined);
    assert.deepEqual(cleaned.properties.$set, { email: "alex@example.com" });
    assert.equal(event.properties.password, "Password1!");
  });
});

describe("posthogClientFrom", () => {
  it("finds the client on either package shape", () => {
    const client = { init() {}, capture() {} };
    assert.equal(posthogClientFrom({ posthog: client }), client);
    assert.equal(posthogClientFrom({ default: client }), client);
    assert.equal(posthogClientFrom({ default: { default: client } }), client);
    assert.equal(posthogClientFrom({}), null);
  });
});
