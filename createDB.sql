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
-- INVENTORY (current stock)
-- =========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    location_id INTEGER REFERENCES locations(id),
    quantity NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INVENTORY TRANSACTIONS (history of changes)
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
