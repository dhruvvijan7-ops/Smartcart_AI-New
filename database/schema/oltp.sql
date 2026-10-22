-- SmartCart AI — OLTP Schema
-- Run this first to set up the operational database

CREATE SCHEMA IF NOT EXISTS oltp;

SET search_path TO oltp;

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
  store_type VARCHAR(50) NOT NULL DEFAULT 'supermarket',
  manager_name VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  city VARCHAR(100),
  lead_time_days INTEGER DEFAULT 2,
  reliability_score NUMERIC(3,2) DEFAULT 0.85 CHECK (reliability_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  sku VARCHAR(50) UNIQUE NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  supplier_id INTEGER REFERENCES suppliers(id),
  zone VARCHAR(50) DEFAULT 'A',
  expiry_days INTEGER NOT NULL DEFAULT 7,
  reorder_threshold INTEGER DEFAULT 20,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  unit_price NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock (current inventory state per product per store)
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  quantity_on_hand NUMERIC(10,2) DEFAULT 0,
  expiry_date DATE,
  batch_id VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id, batch_id)
);

-- Purchases (supplier → store)
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  customer_id INTEGER REFERENCES customers(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_applied NUMERIC(5,2) DEFAULT 0,
  sale_date TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'cash',
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'completed',
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (key-value store for app config)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (for AI decision trail — Feature 7)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  entity VARCHAR(50),
  entity_id INTEGER,
  reason TEXT,
  model_used VARCHAR(100),
  outcome TEXT,
  trust_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Actions (for bandit learning — Feature 5)
CREATE TABLE IF NOT EXISTS discount_actions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  discount_pct NUMERIC(5,2) NOT NULL,
  strategy VARCHAR(50) DEFAULT 'epsilon_greedy',
  reward NUMERIC(5,3),
  sell_through_qty NUMERIC(10,2),
  outcome VARCHAR(30) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Reorder Actions (Feature 6)
CREATE TABLE IF NOT EXISTS reorder_actions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  suggested_qty NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  auto_executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('trust_level', '2'),
  ('discount_epsilon', '0.1'),
  ('briefing_hour', '8'),
  ('waste_alert_threshold', '80'),
  ('store_name', 'SmartCart SuperMart — Bengaluru')
ON CONFLICT (key) DO NOTHING;
