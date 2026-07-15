# Auth + billing setup (run once per database)

From `upright-server/`:

```bash
# 1. Create clients + users tables, rename organization_id → client_id
node scripts/setup-auth-schema.js

# 1b. Foreign key + unique SKU per client on items
node scripts/enforce-item-client-scoping.js

# 1c. Stripe billing columns on clients
node scripts/setup-billing-schema.js

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

# 5. Seed demo login (subscription_status forced active — no Checkout needed)
node scripts/seed-dev-user.js
```

Demo credentials: `founder@demo.com` / `password123`
