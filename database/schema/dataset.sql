CREATE SCHEMA IF NOT EXISTS dataset;

CREATE TABLE IF NOT EXISTS dataset.stores (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120) UNIQUE NOT NULL,
  city            VARCHAR(120),
  lead_time_days  INTEGER NOT NULL DEFAULT 3,
  safety_days     INTEGER NOT NULL DEFAULT 2,
  active_upload_id INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset.uploads (
  id              SERIAL PRIMARY KEY,
  store_id        INTEGER NOT NULL REFERENCES dataset.stores(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  format          VARCHAR(10),
  sha256          CHAR(64),
  size_bytes      INTEGER,
  row_count       INTEGER,
  rows_matched    INTEGER,
  rows_discarded  INTEGER DEFAULT 0,
  column_count    INTEGER,
  header_raw      TEXT,
  mapping         JSONB NOT NULL,
  filter          JSONB,
  parse_errors    INTEGER DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'ready',
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dataset_uploads_store ON dataset.uploads(store_id);

CREATE TABLE IF NOT EXISTS dataset.records (
  id          BIGSERIAL PRIMARY KEY,
  upload_id   INTEGER NOT NULL REFERENCES dataset.uploads(id) ON DELETE CASCADE,
  row_number  INTEGER NOT NULL,
  raw         JSONB NOT NULL,
  parsed      JSONB NOT NULL,
  issues      JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_dataset_records_upload ON dataset.records(upload_id);

CREATE TABLE IF NOT EXISTS dataset.manual_items (
  id               SERIAL PRIMARY KEY,
  store_id         INTEGER NOT NULL REFERENCES dataset.stores(id) ON DELETE CASCADE,
  product_name     VARCHAR(255) NOT NULL,
  category         VARCHAR(120),
  stock            NUMERIC(12,2) DEFAULT 0,
  reorder_level    NUMERIC(12,2),
  reorder_quantity NUMERIC(12,2),
  unit_price       NUMERIC(12,2),
  unit_cost        NUMERIC(12,2),
  units_sold       NUMERIC(12,2),
  expiry_date      DATE,
  received_date    DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dataset_manual_items_store ON dataset.manual_items(store_id);

CREATE TABLE IF NOT EXISTS dataset.profiles (
  upload_id    INTEGER PRIMARY KEY REFERENCES dataset.uploads(id) ON DELETE CASCADE,
  profile      JSONB NOT NULL,
  computed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dataset.metrics (
  scope        VARCHAR(20) NOT NULL,
  scope_id     INTEGER NOT NULL DEFAULT 0,
  payload      JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (scope, scope_id)
);
