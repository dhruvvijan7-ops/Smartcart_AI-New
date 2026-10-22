-- Seed the dataset.stores table used by /api/stores, /api/compare and the upload wizard.
-- These are the multi-store network the dataset analytics engine compares against.
-- Idempotent: safe to run repeatedly.

INSERT INTO dataset.stores (name, city, lead_time_days, safety_days) VALUES
  ('SmartCart SuperMart — Bengaluru', 'Bengaluru', 3, 2),
  ('SmartCart Express — Mysuru',      'Mysuru',    2, 2),
  ('SmartCart Metro — Mangaluru',     'Mangaluru', 4, 3)
ON CONFLICT (name) DO NOTHING;
