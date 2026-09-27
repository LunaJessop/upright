# Auth + billing setup (run once per database)

From `upright-server/`:

```bash
# 1. Create clients + users tables, rename organization_id → client_id
node scripts/setup-auth-schema.js

# 1b. Foreign key + unique SKU per client on items
node scripts/enforce-item-client-scoping.js

# 1c. Stripe billing columns on clients
node scripts/setup-billing-schema.js

# 1d. Item tags (tags + item_tags)
node scripts/setup-tags.js

# 1e. Item cost/sell + batch economics snapshots
node scripts/setup-item-pricing-and-batch-economics.js

# 1f. Purchase lots (vendor lot receives for buy items)
node scripts/setup-purchase-lots.js

# Optional: remove test clients with no Stripe subscription
# node scripts/purge-clients-without-subscription.js          # dry-run
# node scripts/purge-clients-without-subscription.js --execute
# node scripts/purge-clients-without-subscription.js --execute --keep-ids=1

# 2. Add to .env (see .env.example):
# JWT_SECRET=your-long-random-string
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` locally
# STRIPE_PRICE_ID=price_...              # $25/mo monthly (or STRIPE_PRICE_ID_MONTHLY)
# STRIPE_PRICE_ID_YEARLY=price_...       # $250/yr yearly
# FRONTEND_URL=http://localhost:3000
# BILLING_GRACE_DAYS=7
#
# Access model: active + in-grace past_due = full write.
# canceled / unpaid / grace-expired past_due = read-only (browse + export).
# incomplete (never paid) = billing wall until checkout.

# 3. Local webhooks (keep running while testing payments):
# stripe listen --forward-to localhost:3001/api/stripe/webhook

# 4. Restart the Express server after changing .env

# 5. Seed a local-only dev login (subscription_status forced active — no Checkout needed).
#    This public repo does not publish a login. Run the seed script in upright-server;
#    it prints the email and password it created. Use those for local development only,
#    and do not commit them.
#
#    Companion change (LunaJessop/upright-server): scripts/seed-dev-user.js reads the
#    dev email and password from environment variables, or generates a random password
#    when they are unset, and refuses to run when pointed at production.
node scripts/seed-dev-user.js
```

Local dev credentials come from `upright-server/scripts/seed-dev-user.js`, not from this repository. After the script runs, sign in with the email and password it prints. The companion change in [LunaJessop/upright-server](https://github.com/LunaJessop/upright-server) makes that script read credentials from environment variables or generate a random password, and refuse to run on production.
