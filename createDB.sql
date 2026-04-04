-- MRP schema for upright (PostgreSQL)
-- Optional: for multi-tenant SKU uniqueness, prefer UNIQUE (organization_id, sku) instead of UNIQUE (sku) on items.

-- =========================================
-- ORGANIZATIONS
-- =========================================
CREATE TABLE organizations (
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
-- USERS
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ITEMS (raw materials, finished goods, subassemblies)
-- =========================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    item_type TEXT NOT NULL,
    make_or_buy TEXT NOT NULL,
    unit_of_measure TEXT NOT NULL,
    default_cost NUMERIC,
    active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- BOMs (Bill of Materials header)
-- =========================================
CREATE TABLE boms (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    parent_item_id INTEGER NOT NULL REFERENCES items(id),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- BOM ITEMS (components of each BOM)
-- =========================================
CREATE TABLE bom_items (
    id SERIAL PRIMARY KEY,
    bom_id INTEGER NOT NULL REFERENCES boms(id),
    component_item_id INTEGER NOT NULL REFERENCES items(id),
    quantity_required NUMERIC NOT NULL,
    unit_of_measure TEXT,
    scrap_factor NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- LOCATIONS (for inventory storage)
-- =========================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INVENTORY (current stock)
-- =========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
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
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
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
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
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
-- JOBS (production runs)
-- =========================================
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    bom_id INTEGER REFERENCES boms(id),
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
-- JOB COMPONENTS (materials allocated to jobs)
-- =========================================
CREATE TABLE job_components (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity_allocated NUMERIC,
    unit_of_measure TEXT
);

-- Optional: indexes on foreign keys / filters (uncomment to apply)
-- CREATE INDEX idx_users_organization_id ON users (organization_id);
-- CREATE INDEX idx_items_organization_id ON items (organization_id);
-- CREATE INDEX idx_boms_organization_id ON boms (organization_id);
-- CREATE INDEX idx_bom_items_bom_id ON bom_items (bom_id);
-- CREATE INDEX idx_locations_organization_id ON locations (organization_id);
-- CREATE INDEX idx_inventory_organization_id ON inventory (organization_id);
-- CREATE INDEX idx_inventory_item_id ON inventory (item_id);
-- CREATE INDEX idx_inventory_transactions_organization_id ON inventory_transactions (organization_id);
-- CREATE INDEX idx_sales_orders_organization_id ON sales_orders (organization_id);
-- CREATE INDEX idx_sales_order_items_sales_order_id ON sales_order_items (sales_order_id);
-- CREATE INDEX idx_jobs_organization_id ON jobs (organization_id);
-- CREATE INDEX idx_job_components_job_id ON job_components (job_id);
