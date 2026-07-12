-- Run once if your DB still uses organizations / organization_id.
-- Skip if you created the schema fresh from createDB.sql.

ALTER TABLE IF EXISTS organizations RENAME TO clients;

ALTER TABLE IF EXISTS users RENAME COLUMN organization_id TO client_id;

ALTER TABLE IF EXISTS items RENAME COLUMN organization_id TO client_id;
ALTER TABLE IF EXISTS locations RENAME COLUMN organization_id TO client_id;
ALTER TABLE IF EXISTS inventory RENAME COLUMN organization_id TO client_id;
ALTER TABLE IF EXISTS inventory_transactions RENAME COLUMN organization_id TO client_id;
ALTER TABLE IF EXISTS sales_orders RENAME COLUMN organization_id TO client_id;
ALTER TABLE IF EXISTS batches RENAME COLUMN organization_id TO client_id;

-- Role constraint (drop old default first if needed)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('founder', 'admin', 'user'));
