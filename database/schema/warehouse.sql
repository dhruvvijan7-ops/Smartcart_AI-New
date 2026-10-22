-- SmartCart AI — Data Warehouse Star Schema
-- Run after oltp.sql

CREATE SCHEMA IF NOT EXISTS warehouse;

SET search_path TO warehouse;

-- Dimension: Time
CREATE TABLE IF NOT EXISTS dim_time (
  date_id DATE PRIMARY KEY,
  day_of_week INTEGER,
  day_name VARCHAR(10),
  week INTEGER,
  month INTEGER,
  month_name VARCHAR(10),
  quarter INTEGER,
  year INTEGER,
  is_weekend BOOLEAN DEFAULT FALSE
);

-- Dimension: Product
CREATE TABLE IF NOT EXISTS dim_product (
  product_sk SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50),
  unit VARCHAR(20),
  expiry_days INTEGER,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE
);

-- Dimension: Category
CREATE TABLE IF NOT EXISTS dim_category (
  category_sk SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_category VARCHAR(100)
);

-- Dimension: Store/Zone
CREATE TABLE IF NOT EXISTS dim_store (
  store_sk SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  zone VARCHAR(50),
  city VARCHAR(100),
  store_type VARCHAR(50)
);

-- Fact: Waste Events
CREATE TABLE IF NOT EXISTS fact_waste_events (
  id SERIAL PRIMARY KEY,
  date_id DATE REFERENCES dim_time(date_id),
  product_sk INTEGER REFERENCES dim_product(product_sk),
  category_sk INTEGER REFERENCES dim_category(category_sk),
  store_sk INTEGER REFERENCES dim_store(store_sk),
  quantity_wasted NUMERIC(10,2) DEFAULT 0,
  loss_value NUMERIC(10,2) DEFAULT 0,
  risk_score NUMERIC(5,2),
  discount_applied NUMERIC(5,2) DEFAULT 0,
  reason VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast OLAP queries
CREATE INDEX IF NOT EXISTS idx_fact_waste_date ON fact_waste_events(date_id);
CREATE INDEX IF NOT EXISTS idx_fact_waste_product ON fact_waste_events(product_sk);
CREATE INDEX IF NOT EXISTS idx_fact_waste_category ON fact_waste_events(category_sk);
CREATE INDEX IF NOT EXISTS idx_fact_waste_store ON fact_waste_events(store_sk);
