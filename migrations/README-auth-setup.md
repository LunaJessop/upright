# Auth setup (run once per database)

From `upright-server/`:

```bash
# 1. Create clients + users tables, rename organization_id → client_id
node scripts/setup-auth-schema.js

# 1b. Foreign key + unique SKU per client on items
node scripts/enforce-item-client-scoping.js

# 2. Add JWT_SECRET to .env (required for login tokens)
# JWT_SECRET=your-long-random-string

# 3. Restart the Express server after changing .env

# 4. Seed demo login
node scripts/seed-dev-user.js
```

Demo credentials: `founder@demo.com` / `password123`
