/* Shared types for SmartCart API payloads */

export interface Capability {
  has_upload?: boolean
  has_product_name?: boolean
  has_category?: boolean
  has_stock?: boolean
  has_reorder?: boolean
  has_price?: boolean
  has_cost?: boolean
  has_sales?: boolean
  has_expiry?: boolean
  has_dates?: boolean
  has_manual?: boolean
  has_lead_time?: boolean
}

export interface StoreRecord {
  id: number
  name: string
  city: string | null
  lead_time_days: number
  safety_days: number
  active_upload_id: number | null
  created_at: string
}

export interface UploadRecord {
  id: number
  store_id: number
  filename: string
  format: string
  sha256: string
  size_bytes: number
  row_count: number
  rows_matched: number
  rows_discarded: number
  column_count: number
  header_raw: string
  mapping: Record<string, string | null> | null
  filter: { column?: string; value?: string } | null
  parse_errors: number
  status: string
  uploaded_at: string
}

export interface StoreItem {
  id: string | number
  source: 'dataset' | 'manual'
  row_number?: number
  product_name: string
  category: string | null
  stock: number | null
  reorder_level: number | null
  reorder_quantity: number | null
  unit_price: number | null
  unit_cost: number | null
  units_sold: number | null
  expiry_date: string | null
  received_date: string | null
  issues?: string[]
  created_at?: string
}

export interface StoreItemsResponse {
  store_id: number
  active_upload_id: number | null
  page: number
  page_size: number
  total: number
  dataset_total: number
  manual_total: number
  items: StoreItem[]
}

export interface OrderLine {
  item: string
  category: string | null
  current_stock: number
  reorder_point: number
  safety_stock: number
  avg_daily: number
  recommended_qty: number
  formula_source: string
  unit_price: number | null
  unit_cost: number | null
  est_cost: number | null
  est_cost_basis: string
}

export interface OrdersSection {
  available: boolean
  unavailable_reason?: string
  next_batch: OrderLine[]
  items: OrderLine[]
  totals: {
    items_to_order: number
    total_units: number
    total_est_cost: number | null
    est_cost_basis: string
  }
  by_category: Record<string, number>
  by_formula_source: Record<string, number>
}

export interface ExpirySection {
  available: boolean
  unavailable_reason?: string
  anchor_date?: string
  items?: number
  total_expired_rows?: number
  bands_histogram?: Record<string, number>
  expired_by_category?: Record<string, number>
  shelf_life_histogram?: Record<string, number>
  most_expiring?: {
    item: string
    category: string | null
    rows: number
    rows_expired?: number
    risk_band?: string
    expiry_risk?: number
    shelf_life_avg?: number
    shelf_life_min?: number
  }[]
}

export interface SalesItem {
  item: string
  rank: number
  category: string | null
  total_units: number
  revenue: number | null
  stock: number | null
  unit_price: number | null
  unit_cost: number | null
  profit: number | null
  share_pct: number | null
  avg_per_day: number | null
  sell_through?: number
  reason?: string
}

export interface SalesSection {
  available: boolean
  unavailable_reason?: string
  total_units?: number
  sell_through?: number
  top_sellers?: SalesItem[]
  low_sellers?: SalesItem[]
  items?: SalesItem[]
  by_category?: Record<string, number>
  monthly_series?: { month: string; units: number }[]
  profit?: { available: boolean; unavailable_reason?: string; total_revenue?: number | null; total_profit?: number | null }
}

export interface StoreMetrics {
  store: {
    id: number
    name: string
    city: string | null
    lead_time_days: number
    safety_days: number
    active_upload_id: number | null
  }
  upload: {
    id: number
    filename: string
    row_count: number
    rows_matched: number
    rows_discarded: number
    uploaded_at: string
  } | null
  anchor_date: string | null
  window_days: number | null
  item_count: number
  record_count: number
  manual_item_count: number
  computed_at: string | null
  capabilities: Capability
  expiry: ExpirySection
  sales: SalesSection
  orders: OrdersSection
}

export interface CompareStoreRow {
  store_id: number
  name: string
  city: string | null
  record_count: number
  item_count: number
  capabilities: Capability
  expiry_available: boolean
  sales_available: boolean
  total_expired_rows: number | null
  total_units: number | null
  total_profit: number | null
  items_to_order: number | null
  total_order_units: number | null
  total_est_cost: number | null
  est_cost_basis: string | null
  computed_at: string | null
}

export interface ComparePayload {
  store_count: number
  stores: CompareStoreRow[]
  common_items: {
    item: string
    store_count: number
    best_store: string | null
    stores: { store_id: number; name: string; total_units: number | null; category: string | null }[]
  }[]
  consolidated_orders: {
    item: string
    category: string | null
    total_recommended_qty: number
    stores: {
      store_id: number
      name: string
      recommended_qty: number
      formula_source: string
      unit_price: number | null
      unit_cost: number | null
      est_cost: number | null
    }[]
  }[]
  category_mix: Record<string, { name: string; categories: Record<string, number> }>
  capabilities?: { stores_with_upload: number }
  computed_at: string | null
}

export interface ProductRow {
  id: number
  name: string
  category: string
  sub_category?: string
  sku?: string
  unit?: string
  supplier_id?: number
  supplier_name?: string
  zone?: string
  unit_cost?: string | number
  unit_price?: string | number
  image?: string
  stock?: number
  quantity_on_hand?: number
  reorder_threshold?: number
  reorderPoint?: number
  expiry_date?: string
  expiry_days?: number
  batch_id?: string
  risk_score?: number
  riskScore?: number
  risk_tier?: string
  riskClass?: string
  recommendedAction?: string
  telemetry?: string
  daysToExpiry?: number
}

export interface DashboardKpis {
  totalItems: number
  criticalCount: number
  highCount: number
  warningCount: number
  potentialSavings: string
  unreadNotifications: number
  wasteReductionPct: string
}
