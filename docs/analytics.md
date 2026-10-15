# Product analytics

Upright uses [PostHog](https://posthog.com) to see what people click and which pages they move through. Clicks are captured automatically. Session replay is on, with every input masked, so passwords and typed text are not recorded.

Analytics starts only when `NEXT_PUBLIC_POSTHOG_KEY` is set at build time. Local dev and preview deploys without that key run normally and do not call PostHog.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Yes, in production | Project API key (`phc_...`). Public in the browser bundle. |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Ingest host. Defaults to `https://us.i.posthog.com`. Set this for an EU project, for example `https://eu.i.posthog.com`. |

These are read when the site is built. On Netlify, add them under Site configuration, then Environment variables, then redeploy.

## What is recorded

- Clicks and other autocaptured interactions.
- A page view on the first load and on each App Router navigation.
- A page leave when someone moves on.
- Session replay, with `maskAllInputs` so form fields are masked.
- After login, or when a saved session is restored, the signed-in user id. Email is attached only when it is already on that user object.
- Logout (and a session that fails to restore) clears the PostHog identity.

Passwords, session tokens, and card details are not part of the identify call. Event properties whose names look like a password, secret, or card number are removed before send. The PostHog project key itself stays on each event, because PostHog rejects events without it.

## Custom events

Prefer this helper. It does nothing when the key is missing:

```js
import { captureAnalyticsEvent } from "@/lib/analytics";

captureAnalyticsEvent("batch_created", { item_id: item.id });
```

The same call against the SDK, once PostHog has started:

```js
import posthog from "posthog-js";

posthog.capture("event_name", { item_id: item.id });
```

Do not put passwords, tokens, or payment details in the property object.
