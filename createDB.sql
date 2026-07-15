-- MRP schema for upright (PostgreSQL)
-- Multi-tenant: each row belongs to a client (company using Upright).
-- Prefer UNIQUE (client_id, sku) on items instead of UNIQUE (sku) alone.

-- =========================================
-- CLIENTS (companies using Upright)
-- =========================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT TRUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'incomplete',
    past_due_started_at TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- USERS (login accounts; roles: founder > admin > user)
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('founder', 'admin', 'user')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ITEMS (raw materials, finished goods, subassemblies)
-- =========================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    make_or_buy TEXT NOT NULL,
    unit_of_measure TEXT NOT NULL,
    default_unit_price NUMERIC,
    active BOOLEAN DEFAULT TRUE,
    vendor INTEGER,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX items_client_vendor_sku ON items (client_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

-- =========================================
-- VENDORS (suppliers for buy items)
-- =========================================
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    site_link TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, name)
);

CREATE INDEX idx_vendors_client_id ON vendors (client_id);

ALTER TABLE items
  ADD CONSTRAINT items_vendor_fkey
  FOREIGN KEY (vendor) REFERENCES vendors(id) ON DELETE SET NULL;

-- =========================================
-- ITEM ROUTERS (production phase templates for make items)
-- =========================================
CREATE TABLE item_routers (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    name TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id)
);

CREATE TABLE item_router_phases (
    id SERIAL PRIMARY KEY,
    router_id INTEGER NOT NULL REFERENCES item_routers(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER,
    UNIQUE (router_id, sequence)
);

-- =========================================
-- CLIENT ROUTER PHASE TEMPLATES (reusable library per company)
-- =========================================
CREATE TABLE client_router_phase_templates (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, name)
);

-- =========================================
-- BOM ITEMS (recipe lines; parent_item_id owns the recipe)
-- =========================================
CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    parent_item_id INTEGER NOT NULL REFERENCES items(id),
    component_item_id INTEGER NOT NULL REFERENCES items(id),
    quantity NUMERIC NOT NULL,
    UNIQUE (parent_item_id, component_item_id)
);

-- =========================================
-- LOCATIONS (for inventory storage)
-- =========================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    name TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INVENTORY (current stock — one pool per item for v1)
-- =========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    location_id INTEGER REFERENCES locations(id),
    quantity NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, item_id)
);

CREATE INDEX idx_inventory_client_id ON inventory (client_id);
CREATE INDEX idx_inventory_item_id ON inventory (item_id);

-- =========================================
-- ITEM INVENTORY GOALS (healthy stock band)
-- =========================================
CREATE TABLE item_inventory_goals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    goal_min NUMERIC NOT NULL DEFAULT 0,
    goal_max NUMERIC NOT NULL DEFAULT 0,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id),
    CHECK (goal_min >= 0 AND goal_max >= goal_min)
);

CREATE INDEX idx_item_inventory_goals_client_id ON item_inventory_goals (client_id);

-- =========================================
-- INVENTORY TRANSACTIONS (history of changes — unused in v1 UI)
-- =========================================
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    location_id INTEGER REFERENCES locations(id),
    quantity_change NUMERIC NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SALES ORDERS
-- =========================================
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    status TEXT DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipping_date TIMESTAMP,
    total NUMERIC,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SALES ORDER ITEMS
-- =========================================
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC,
    total NUMERIC
);

-- =========================================
-- BATCHES (production runs)
-- =========================================
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity NUMERIC NOT NULL,
    sku TEXT,
    status TEXT DEFAULT 'planned',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- BATCH COMPONENTS (materials allocated to batches)
-- =========================================
CREATE TABLE batch_components (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity_allocated NUMERIC,
    unit_of_measure TEXT
);

-- =========================================
-- ITEM SKUS (lot / batch numbers per item)
-- =========================================
CREATE TABLE item_skus (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    batch_id INTEGER REFERENCES batches(id),
    source TEXT CHECK (source IN ('purchase', 'production')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, sku)
);

-- =========================================
-- BATCH PHASES (snapshot of item router per production run)
-- =========================================
CREATE TABLE batch_phases (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    source_phase_id INTEGER REFERENCES item_router_phases(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by INTEGER REFERENCES users(id),
    UNIQUE (batch_id, sequence)
);

-- Optional: indexes on foreign keys / filters (uncomment to apply)
-- CREATE INDEX idx_users_client_id ON users (client_id);
-- CREATE INDEX idx_items_client_id ON items (client_id);
-- CREATE INDEX idx_locations_client_id ON locations (client_id);
-- CREATE INDEX idx_inventory_client_id ON inventory (client_id);
-- CREATE INDEX idx_inventory_item_id ON inventory (item_id);
-- CREATE INDEX idx_inventory_transactions_client_id ON inventory_transactions (client_id);
-- CREATE INDEX idx_sales_orders_client_id ON sales_orders (client_id);
-- CREATE INDEX idx_sales_order_items_sales_order_id ON sales_order_items (sales_order_id);
-- CREATE INDEX idx_item_skus_item_id ON item_skus (item_id);
-- CREATE INDEX idx_item_skus_client_id ON item_skus (client_id);
-- CREATE INDEX idx_item_routers_client_id ON item_routers (client_id);
-- CREATE INDEX idx_item_router_phases_router_id ON item_router_phases (router_id);
-- CREATE INDEX idx_batch_phases_batch_id ON batch_phases (batch_id);
