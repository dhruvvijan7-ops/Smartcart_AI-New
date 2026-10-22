# SmartCart AI — Frontend Redesign Implementation Report

Date: 2026-10-16  
Scope: complete frontend redesign of `frontend/` per the MASTER IMPLEMENTATION PROMPT. **No backend code was modified.**

---

## 1. What was delivered

### Design system (`frontend/src/index.css`)
A single semantic-token stylesheet (~2,600 lines) replaces all ad-hoc styling.

| Token group | Landing palette | App palette |
|---|---|---|
| Background | ivory `#EAE6DE` | app bg `#F5F7FA` |
| Primary | editorial blue `#226192` | brand `#226192` |
| Accent | coral `#EF8557` | accent `#EF8557` |
| Text | ink `#172B3A` | `#172B3A` / secondary `#617184` |
| Borders | warm `#D5CFC4` | `#E1E7ED` |
| Status | — | success `#237A57`, warning `#B7791F`, critical `#C34242` |

Also includes: dark-mode and density variants (comfortable / compact / spacious), reduced-motion support, and utility classes for buttons, forms, cards, badges, tables, empty/error/skeleton states, modal, pagination, tabs, shell chrome, dropzone/stepper, charts, and landing sections. Typography: Manrope (display), Inter (body), DM Serif Display (landing editorial), loaded in `index.html`. Font Awesome was removed; all icons are `lucide-react`.

### Landing page (`src/pages/public/`)
Five composed sections — `Hero`, `Story`, `Features`, `Process`, `Closing` (differentiation + FAQ accordion + final CTA) — plus `PublicLayout` / `PublicNavbar` / `PublicFooter`. Scroll-reveal via `useRevealAll` (IntersectionObserver, disabled under reduced-motion / `data-no-animations`).

### Auth (`src/pages/auth/`)
- `/login` — **local display-profile** sign-in (name + role stored in localStorage via `ProfileContext`). The API has no account system; this is labelled as such in the UI. No passwords, no server claim.
- `/forgot-password` — honest "recovery unsupported by this backend" screen with a real `/health` check.
- No registration or password-reset pages; no route guards (all routes remain open, as before). "Sign out" clears the local profile only.

### App shell (`src/components/AppShell.tsx`)
Sidebar grouped into Overview / Intelligence / Data / Workspace, mobile drawer, topbar (search → `/inventory?q=`, alerts bell, theme toggle, avatar menu with sign-out), skip-link, floating assistant widget, `<Outlet/>`.

### Pages (all routes under `/`)
| Route | Page | Data source |
|---|---|---|
| `/dashboard` | Dashboard | `/api/dashboard/kpis`, `/api/stores`, `/api/compare`, `/api/ai/mine-rules`, `/api/ai/heatmap`; demo-only series explicitly labelled |
| `/inventory` | Inventory | `/api/products` (search / category / zone filters synced to URL, pagination, detail modal, CSV export) |
| `/stores` | Stores | `/api/stores` |
| `/stores/new` | AddStore | `POST /api/stores` |
| `/stores/:storeId` | StoreDetail | `/api/stores/:id`, `/items`, `/metrics`, `/orders`, `/export`, manual item CRUD |
| `/compare` | Compare | `/api/compare` (side-by-side metrics, common items, consolidated orders, CSV export) |
| `/upload` | UploadWizard | multi-step (store & file → mapping → review → result) against `POST /api/dataset/upload`; client-side header parse; optional row filter; duplicate detection |
| `/history` | DataHealth | `/api/dataset/health`, `/uploads`, `/rows`, `/profile`, `/export`, `/delete` |
| `/alerts` | Alerts | derived from `/api/compare` (expired rows, reorder lists, stores without datasets) — `/api/notifications` is broken, stated in UI |
| `/insights` | Insights | `/api/ai/mine-rules` (re-mine POST), `/api/ai/heatmap` |
| `/analytics` | Analytics | `/api/compare` category mix, catalog composition from `/api/products`, zone heatmap, per-store summary table; OLAP cube section with honest degradation |
| `/audit` | AuditTrail | `/api/audit` with shape validation (see §3) |
| `/suppliers` | Suppliers | `/api/suppliers` with shape validation (see §3) |
| `/settings` | Settings | appearance (theme / density / animations), local profile, real backend status checks (`/health`, `/api/dataset/health`) |
| `/onboarding` | Onboarding | live checklist from `/api/stores`, `/api/dataset/health`, `/api/compare` |
| `/workstation` | AiConsole | full-page chat on `/api/ai/chat` with source labelling |
| `*` | NotFound | 404 |

### Shared components
`Button`, `States` (Spinner, skeletons, EmptyState, ErrorState, DegradedBanner), `PageHeader` (Breadcrumb, PageHeader, SectionHeading), `Metrics` (StatCard, StatusBadge, CapabilityChip/Row/Summary), `Modal` + `ConfirmDialog` (focus trap, Escape), `Forms` (FormField, TextInput, PasswordField, SelectField, TextAreaField, SearchInput), `Table` (DataTable + Pagination), `ChartFrame`, `AiChatbotWidget` (same `/api/ai/chat` engine, fallback-labelled).

### Deleted legacy files
`App.css`, `Layout.tsx`, `KPICard.tsx`, `RiskBadge.tsx`, `TrustDial.tsx`, `VantaBackground.tsx`, `LiquidEtherBackground.tsx`, `DynamicAmbientBackground.tsx`, `AboutPanel.tsx`, `CvFreshnessModal.tsx`, `ShapWaterfallModal.tsx`, `AntiGravityWorkstation.tsx` (replaced by `AiConsole.tsx`).

---

## 2. Backend endpoints integrated (real data)

Working and wired into pages:

- `GET /health`
- `GET /api/products` (filters `search`, `category`, `zone`), `GET /api/products/:id`, categories
- `GET /api/dashboard/kpis` — note: `wasteReductionPct` and `wasteTrend` inside this payload are randomised/hardcoded server-side; the Dashboard labels them as illustrative
- Dataset: `GET /dataset/health`, `/uploads`, `/uploads/:id/rows`, `/uploads/:id/profile`, `POST /dataset/upload` (multipart: `file`, `store_id`, optional `mapping`, optional `filter`), `GET /dataset/uploads/:id/export`, `DELETE /dataset/uploads/:id?confirm=true`
- Stores: `GET/POST /api/stores`, `GET/PUT/DELETE /api/stores/:id`, `GET /stores/:id/items` (paged, search, sort), item CRUD, `GET /stores/:id/metrics`, `GET /stores/:id/orders`, `GET /stores/:id/export`, `GET /stores/:id/orders/export?format=csv`
- `GET /api/compare`
- `GET/POST /api/ai/mine-rules`, `GET /api/ai/heatmap`, `GET /api/ai/briefing`, `POST /api/ai/chat`

Upload mapping keys honoured by the server: `product_id, product_name, category, stock, reorder_level, reorder_quantity, unit_price, unit_cost, units_sold, expiry_date, received_date, last_order_date, lead_time_days, store_filter_column` (`product_name` required). Limits: 25 MB / 200k rows.

---

## 3. Broken / degraded endpoints — surfaced honestly, never faked

The frontend validates response shapes before rendering. Failures show `DegradedBanner` / `ErrorState` with retry, never placeholder data.

| Endpoint | Observed server behaviour | Frontend handling |
|---|---|---|
| `GET /api/audit` | Returns **product rows** (multi-statement SQL bug) — no `action_type`/`created_at` | Detected by shape; explains the defect; will not render products as audit events |
| `GET /api/suppliers` | Same product-list bug (or empty body) | Degraded banner naming the route + retry; points to Inventory's supplier column |
| `GET /api/olap/cube` | Responds `{dimension}` with **no `data[]`** (multi-statement query returns nothing usable) | Validation rejects payload; degraded banner with retry |
| `GET /api/ai/heatmap` | 500 when FastAPI microservice (port 8000) is offline | Degraded banner on Insights/Analytics/Dashboard snapshots |
| `POST /api/ai/chat` | Falls back to `smartcart-express-resilient-fallback` **canned replies** when FastAPI is offline | Reply rendered with a prominent warning: scripted examples, not live readings; `source` shown on every message |
| `GET /api/settings` | 500 in some DB states | Settings page checks `/health` + `/api/dataset/health` instead; no fabricated values |
| `/api/notifications`, `/api/stock`, `/api/sales`, `/api/customers`, `/api/discounts`, `/api/reorders`, `/api/purchases`, `/api/receipts`, `/api/dashboard/activity` | Empty / bogus | Not consumed; pages that would need them state the gap (e.g. Alerts) |

Note on `db.js`: the backend silently falls back to an in-memory mock catalog when PostgreSQL is unreachable — `/api/products` then returns 200 fabricated rows. During verification this was observed (Docker stopped) and the Postgres container was restarted to restore real data.

---

## 4. Verification performed

- `npm run build` (tsc -b && vite build): **clean** — 2441 modules, `dist/assets/index-*.js` ≈ 934 kB (gzip ≈ 272 kB), CSS ≈ 55.6 kB (gzip ≈ 11.4 kB).
- `npm run lint` (oxlint): **0 errors**, 3 warnings (standard `only-export-components` notices on context hooks).
- Live test (backend on **:3011**, Vite dev on **:5273** with `VITE_PROXY_TARGET=http://localhost:3011`):
  - All 24 route modules transform through Vite with HTTP 200.
  - Proxy verified: `/api/stores`, `/api/dataset/health`.
  - Endpoint smoke tests: `compare` (4 stores), `stores/1/metrics` (121 items / 990 records, sales+expiry capabilities on), `mine-rules` (3 rules / 20 tx), `ai/chat` (fallback source labelled), `dataset/uploads` (5 seeded files).
  - **Full upload round-trip**: fresh 5-row CSV → `POST /api/dataset/upload` via proxy → `rows_matched=5, parse_errors=0, date_formats=yyyy-mm-dd`; duplicate upload of the same seeded file correctly flagged `duplicate: true`; test upload removed with `DELETE ...?confirm=true` (frontend sends `confirm=true`).
- Environment restored during testing: Docker Desktop restarted, `smartcart-pg` container on port **5433** brought back up (`/api/dataset/health` → `storage: postgres, uploads: 5`).

Ports 3001 and 5173 (occupied by an unrelated project) were left untouched.

---

## 5. How to run

```bash
# 1. Postgres (Docker)
docker start smartcart-pg          # localhost:5433, postgres/postgres, db smartcart

# 2. Backend — port 3011 for testing (3001 is used by another project here)
cd backend
$env:PORT='3011'; node src/index.js

# 3. Frontend dev — proxy to the test backend
cd frontend
$env:VITE_PROXY_TARGET='http://localhost:3011'
npm run dev -- --port 5273 --strictPort
```

Production build: `cd frontend && npm run build` → static assets in `dist/`.

Optional: the FastAPI AI microservice on `:8000` (`AI_SERVICE_URL`) upgrades `/api/ai/heatmap` and removes the canned `/api/ai/chat` fallback; without it the UI labels both honestly.

---

## 6. Known limitations

- No server-side authentication exists; `/login` stores a display profile in localStorage only.
- `wasteReductionPct` / `wasteTrend` on `/api/dashboard/kpis` are randomised server-side — labelled as demo in the UI.
- `/api/audit` and `/api/suppliers` will show real data only after the backend multi-statement SQL bug is fixed.
- Bundle is ~934 kB (gzip ~272 kB) mainly due to Recharts; code-splitting was not applied.
