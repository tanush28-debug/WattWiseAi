# WattWise AI — Total Project Context

**Last updated:** 2026-11-06
**Repository:** `WATTWISE AI`
**Status:** Working full-stack application. Bill OCR and persistence code is verified. The Supabase service-role key is configured server-side (importer/admin scripts only), migration 009 is applied, and 13 BESCOM annual rows are imported. Industrial/government routes enforce role-based access and Zod validation, CORS is origin-whitelisted, and report exports produce real CSV files. Industrial portal runs on a real Karnataka generation benchmark.

This document is the single-source orientation for the project: what it is, how it is built, how data flows, what is real, what is not, and what remains.

---

## 1. What WattWise AI is

WattWise AI is an energy-intelligence platform for three audiences:

| Portal | User | Core jobs |
|---|---|---|
| Consumer | Household electricity customer | Upload and verify an electricity bill (OCR), see consumption/cost/carbon, forecast demand, simulate tariffs, get AI advice, earn Eco-Rewards |
| Industrial | Plant / energy manager | Facility registry, machine-level consumption modelling, benchmarking, anomaly alerts, cost optimization, carbon reporting |
| Government | Regulator / policy admin | State and regional energy analytics, sector breakdowns, tariff management, policy simulation, conservation programs |

The product is India-first: INR currency, Indian number formatting, Karnataka/BESCOM context, CEA emission factors, KERC tariff categories.

**Frontend stack:** React 18, Vite 5, React Router 6, Tailwind 3, Recharts 2, Framer Motion, lucide-react, Axios, Supabase JS.
**Backend stack:** Node.js (ESM), Express 5, Supabase (Postgres + Auth + Storage), Zod, Multer, pdf-parse, Google GenAI SDK.
**Database:** PostgreSQL via Supabase, 19 tables, RLS enabled everywhere, SQL migrations + seeds in `database/`.

There is no TypeScript, no ORM, no frontend test suite, and no CI configuration.

---

## 2. Repository map

```text
WATTWISE AI/
├─ backend/
│  ├─ src/
│  │  ├─ app.js                  Express app, middleware, router mounting
│  │  ├─ server.js               HTTP listener + graceful shutdown
│  │  ├─ config/                 env.js, supabase.js, gemini.js
│  │  ├─ routes/                 auth, bills, analytics, industrial, government, tariff, forecast, ai
│  │  ├─ controllers/            thin request/response adapters
│  │  ├─ services/               business logic (OCR, parsing, analytics, forecasting, data)
│  │  ├─ middleware/             auth, role, upload, validation, errors
│  │  ├─ data/                   karnataka_generation.json (CEA/NPP benchmark)
│  │  └─ utils/                  calculations, formatters
│  ├─ scripts/                   import_bescom_consumption.mjs
│  ├─ tests/                     core_services, bill_parser, api_smoke
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ routes/                 AppRoutes.jsx, ProtectedRoute.jsx
│  │  ├─ layouts/                Public, Auth, Dashboard
│  │  ├─ components/             common, charts, layout
│  │  ├─ pages/                  public, auth, consumer, industrial, government
│  │  ├─ contexts/               AuthContext, ToastContext
│  │  ├─ services/               api client + per-domain services + mockData
│  │  ├─ config/                 constants, navigation, portal assets
│  │  └─ utils/                  formatters
│  ├─ vite.config.js             dev port 3001, /api proxy → :5000
│  └─ package.json
├─ database/
│  ├─ migrations/                001–009 + FIX_RLS_POLICIES.sql + FIX_SIGNUP_TRIGGER.sql
│  └─ seed/                      reference seed, BESCOM CSV + generated import SQL
├─ docs/                         API_SPECIFICATION, ARCHITECTURE, DATABASE_SCHEMA, SECURITY, SETUP_GUIDE, PROJECT_CONTEXT
├─ package.json                  root-level duplicate deps (not used as workspace)
└─ README.md                     placeholder/one line
```

---

## 3. System architecture

```text
Browser (React SPA)
  ├─ Supabase JS client ──► Supabase Auth (login, session, JWT)
  ├─ Axios apiClient ────► Express API (Bearer JWT) ──► Supabase Postgres (RLS)
  │                                                        └─ Storage: electricity-bills
  └─ Direct read of /auth/me for verified role

Express API
  ├─ authenticateUser / optionalAuth
  │    ├─ demo token "demo-jwt-token" → synthetic consumer (isDemo)
  │    ├─ Supabase getUser(token) → verified identity
  │    ├─ user-scoped Supabase client (RLS enforced)
  │    └─ active profiles.role is authoritative; missing/error/inactive profiles deny access
  ├─ Bill pipeline: Multer memory → SHA-256 → pdf-parse → deterministic parser
  │                 → optional Gemini JSON extraction → validation → Storage + DB
  ├─ Analytics / forecast / tariff engines
  └─ Industrial benchmark (CEA/NPP JSON) when no org data exists
```

**Key architectural rule:** authentication requires a valid Supabase JWT and an active `public.profiles` row. Authorization never falls back to editable user metadata or a static demo token.

---

## 4. Backend

### 4.1 Bootstrap

- `backend/src/app.js`: `helmet` → `cors` → JSON (10 MB) → health/root → routers → 404 → error handler.
- Base path: **`/api/v1`**.
- Health: `GET /api/v1/health` and `GET /health` return status, uptime, version, environment, `supabaseConfigured`.
- `backend/src/server.js`: listens on `PORT` (default **5000**), graceful shutdown on SIGTERM/SIGINT.
- CORS: strict allow-list. `FRONTEND_ORIGIN` accepts a comma-separated list; only those origins receive CORS headers. Requests without an `Origin` header (server-to-server, curl) are allowed; any other origin gets no CORS headers and is blocked by the browser.

### 4.2 Environment variables (names only)

Backend (`backend/.env`, `.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `NODE_ENV` | development/production (controls stack traces) |
| `FRONTEND_ORIGIN` | Comma-separated CORS allow-list (scheme + host + port, exact match) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key for user-scoped client |
| `SUPABASE_SECRET_KEY` | Service-role key (configured). Used by `scripts/import_bescom_consumption.mjs` and `scripts/provision_demo_accounts.mjs` via `supabaseAdmin`; no request path uses it |
| `GEMINI_API_KEY` | Gemini API key (server-only) |
| `GEMINI_MODEL` | Primary model |
| `GEMINI_FALLBACK_MODELS` | Comma-separated fallback chain |
| `GEMINI_TIMEOUT_MS` | Per-call timeout (default 90 s) |

Frontend (`frontend/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`, `VITE_APP_MODE` (declared but unused in code).

⚠️ **Configuration note:** `GEMINI_MODEL` is now `gemini-3.8-flash` (verified supported). Gemini free-tier quota is limited per model per day (20 requests); when exhausted, the service logs the quota error and moves to `gemini-flash-lite-latest` from the fallback chain. Do not treat a fallback response as proof that the primary model is available.

### 4.3 API reference

All paths are under `/api/v1`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/auth/me` | required | Return verified user + role |
| GET | `/bills` | required | List user's bills |
| POST | `/bills/upload` | required | Upload bill, run OCR/extraction, persist |
| PATCH | `/bills/:id/confirm` | required | Confirm/correct extraction, persist verified consumption, award points |
| DELETE | `/bills/:id` | required | Delete bill, consumption row, and stored file |
| GET | `/analytics/consumer/overview` | optional | Consumer KPI overview |
| GET | `/analytics/consumption?timeframe=` | optional | Monthly/daily consumption history |
| GET | `/analytics/carbon` | optional | Carbon metrics from verified bills |
| GET | `/analytics/grid-monitor` | none | CEA/NPP grid snapshot (cached) |
| GET | `/industrial/overview` | INDUSTRIAL | DB facilities or CEA/NPP benchmark |
| GET | `/industrial/facilities` | INDUSTRIAL | Facility list |
| POST | `/industrial/facilities` | INDUSTRIAL | Add facility (Zod validated) |
| GET | `/industrial/machines` | INDUSTRIAL | Machine registry (Postgres) |
| POST | `/industrial/machines` | INDUSTRIAL | Add machine entry linked to a verified `facility_id` (Zod validated) |
| GET | `/industrial/anomalies` | INDUSTRIAL | Open anomaly alerts |
| GET | `/industrial/optimization` | INDUSTRIAL | Cost optimization scenarios |
| POST | `/industrial/reports/generate` | INDUSTRIAL | Compile a CSV export from the current dataset (Zod validated) |
| GET | `/government/overview` | GOVERNMENT_ADMIN | National/state overview |
| GET | `/government/regional?filter=` | GOVERNMENT_ADMIN | Regional data |
| GET | `/government/sectors` | GOVERNMENT_ADMIN | Sector breakdown |
| GET | `/government/tariffs` | GOVERNMENT_ADMIN | Tariff list |
| POST | `/government/tariffs` | GOVERNMENT_ADMIN | Create tariff (in-memory; Zod validated) |
| POST | `/government/policy-simulator` | GOVERNMENT_ADMIN | Policy scenario calculation (Zod validated) |
| POST | `/government/reports` | GOVERNMENT_ADMIN | Compile a CSV policy export (Zod validated) |
| GET | `/tariffs/categories` | optional | Tariff catalog |
| POST | `/tariffs/simulate` | optional | Bill simulation |
| GET | `/forecast/demand?horizon=` | optional | Demand forecast |
| POST | `/ai/chat` | optional | AI energy advisor |

**Authorization reality:** bill routes require authentication. Every `/industrial/*` route is mounted with `authenticateUser` + `requireRole('INDUSTRIAL')`, and every `/government/*` route with `authenticateUser` + `requireRole('GOVERNMENT_ADMIN')`. All POST/PATCH bodies pass Zod validation via `validateBody`. The demo token is a synthetic CONSUMER and is therefore rejected by both role gates.

### 4.4 Services

| Service | Responsibility |
|---|---|
| `ocrService` | File validation, PDF text extraction, local-vs-Gemini decision, normalization, merge, finalization |
| `geminiService` | Gemini client, JSON-mode extraction, retries, error classification, advisor responses |
| `billParser` | Deterministic BESCOM-style parser, arithmetic/reading/date validation, confidence scoring |
| `billService` | Upload persistence, duplicate detection, confirm/persist/verify, rewards, delete |
| `analyticsService` | Consumption, cost, carbon, appliance split from verified bills |
| `forecastService` | Trend-based demand projection (requires ≥2 verified bills) |
| `tariffEngine` | Category catalog and statutory bill calculation |
| `governmentService` | National/regional/sector data, policy simulation (partly static/in-memory), CSV policy exports |
| `industrialService` | DB facility/machine aggregation with CEA/NPP benchmark fallback; CSV data exports |
| `gridService` | Optional live grid feed with static CEA/NPP fallback, 5-minute cache |
| `storageService` | Supabase Storage upload/delete for the `electricity-bills` bucket, uid-prefixed paths |
| `csv` util | RFC-style CSV escaping (`toCsv`) used by both report generators |

---

## 5. Bill OCR and verification pipeline

This is the most safety-critical flow in the product.

```text
Upload (PDF/PNG/JPEG, ≤15 MB)
  │
  ├─ Magic-byte + MIME + extension validation (multer memory storage)
  ├─ SHA-256 hash; duplicate check by account number + billing month (409)
  ├─ PDF? → pdf-parse local text extraction
  │
  ├─ If local text is "usable":
  │     parse deterministically → sufficient? (net payable + units + score ≥ 8/11)
  │       YES → LOCAL_PDF_TEXT only, NO Gemini call
  │       NO  → send file + ≤20k chars to Gemini JSON extraction
  │
  ├─ Gemini unavailable/fails → local result + explicit warning, or manual-entry state
  ├─ Merge local + AI when both exist; conflicts are flagged; confidence capped at 0.55 on conflict
  ├─ finalizeExtraction: recompute components, cross-check readings, dates, arithmetic (±₹1)
  │     status = HIGH_CONFIDENCE | NEEDS_REVIEW | MANUAL_ENTRY_REQUIRED
  └─ Persist bill row (status EXTRACTED) + Storage object; upload returns 201
        │
        └─ User reviews/edits → PATCH /bills/:id/confirm
              ├─ Validate units ≥ 0, finite amount, UUID
              ├─ Update bill → VERIFIED, store userConfirmed metadata
              ├─ Upsert energy_consumption (ACTUAL, USER_CONFIRMED_BILL)
              └─ Award +100 Eco-Rewards once
```

**Non-negotiable rules encoded in the implementation:**

- Never fabricate missing fields; return `null` / `MANUAL_ENTRY_REQUIRED`.
- Never auto-verify uncertain OCR; confirmation is explicit.
- Never claim success before the database write succeeds; storage rollback on insert failure.
- Confidence scores are heuristic, not calibrated probabilities.
- Do not log full bills, account numbers, or consumer data.
- Gemini key stays server-side (`process.env.GEMINI_API_KEY`); never returned to the client.

**Gemini configuration:** `temperature: 0`, JSON response MIME type, `maxOutputTokens: 8192`, per-call timeout, two attempts per model, then the fallback chain. Errors are classified as auth/quota/transient/timeout/unavailable/invalid/malformed.

**Persistence:** requires an authenticated, non-demo user. Demo token users can browse but cannot save bills (`403 AUTH_REQUIRED_FOR_BILLS`).

---

## 6. Industrial data strategy

The industrial portal has two modes, chosen per request:

### Mode A — Database mode (user's own facilities)

Active when the authenticated user has an `organizationId` and the organization has facilities or consumption rows.

- Reads `facilities`, `energy_consumption` (last 12 months, ≤5,000 rows), `machines`, and open `anomaly_alerts`.
- Aggregates consumption, cost, carbon, capacity utilization, monthly trend (last 6 months), and anomalies.
- Facilities page becomes editable ("Register New Facility").

### Mode B — CEA/NPP benchmark (default today)

Active when there is no authenticated org data or the user is unauthenticated/demo.

- Data file: `backend/src/data/karnataka_generation.json`.
- Source: CEA/NPP station-wise generation compiled by CHETNA (Zenodo record 21865308), **CC BY 4.0**.
- Contents: 23 Karnataka plants, FY 2018-19 → 2023-24, unit counts, capacity, net generation, reported CO₂, load factor, YoY change, coordinates, 6 plant-year trend points, 6 deviations.
- Latest FY totals: **56,338,420 MWh**, **39,817,735.47 t CO₂**, **13,809 MW** installed capacity, **46.6%** average PLF, **0.707 kg CO₂/kWh** generation intensity.
- UI labels this explicitly as Karnataka power plants, **not the user's factories**, and marks facilities read-only.

**What is real vs not:**

| Data | Status |
|---|---|
| CEA/NPP plant generation, capacity, CO₂, unit counts | Real, public, licensed |
| Previous-FY plant values | Derived from reported YoY change |
| User facility consumption, cost, machines | Real only if bills/meter data are linked |
| Machine power ratings/duty hours | Never invented; user must enter them |
| BESCOM annual DISCOM totals | Real aggregate, but not facility-level and RLS-hidden |

**BESCOM dataset:** `database/seed/bescom_consumption_2010_2023.csv` contains 13 annual DISCOM-level rows (FY2010-11 → 2022-23) with demand, collection, consumers, metered consumption (MU), and energy input. The importer converts MU → kWh and writes `ANNUAL` rows with `source_provenance='BESCOM_OPEN_DATA'`. These rows have no owner, so RLS hides them from normal users. **Imported 2026-11-06** with the service-role key: 13 rows totalling 243,646,360,000 kWh, matching the CSV exactly; the publishable key reads 0 rows, as designed. Surfacing them in the UI requires a read-only public benchmark view.

---

## 7. Analytics, forecasting, carbon, tariffs

- **Consumer analytics** derives only from `VERIFIED` bills; with none, it returns honest zeros/empty states.
- **Carbon** uses the CEA v19 factor **0.8200 kg CO₂e/kWh**. For industrial users with no verified bills, a separate, clearly labelled Karnataka generation-emissions benchmark is shown (state totals, not personal footprint).
- **Forecast** needs ≥2 verified bills; otherwise returns an insufficient-data payload with nulls. The projection is a trend rate with a −3% seasonal drift and a hardcoded confidence value (0.92) that is not a calibrated probability.
- **Tariffs** come from a static catalog (Domestic, Commercial, Industrial HT, Agricultural, Public lighting) with optional DB overrides; math is shared with the bill calculator.
- **Grid monitor** tries an optional live feed, then falls back to a static CEA/NPP snapshot marked `isLive: false`.

---

## 8. Database

19 tables, all UUID primary keys, all timestamps UTC. RLS enabled on every table.

| Domain | Tables |
|---|---|
| Identity | `profiles` (1:1 auth.users), `organizations`, `organization_members` |
| Assets | `facilities`, `machines` |
| Billing | `electricity_bills`, `energy_consumption` |
| Tariffs | `tariff_configurations`, `tariff_slabs`, `carbon_emission_factors` |
| Intelligence | `demand_forecasts`, `anomaly_alerts`, `ai_recommendations` |
| Engagement | `reward_accounts`, `reward_transactions`, `conservation_challenges` |
| Reference | `regional_energy_data`, `data_sources`, `audit_logs` |

**Enums:** `user_role` (CONSUMER, INDUSTRIAL, GOVERNMENT_ADMIN), `bill_status` (PENDING, PROCESSING, EXTRACTED, VERIFIED, FAILED), `anomaly_severity` (LOW, MEDIUM, HIGH, CRITICAL). Other allowed values use `TEXT + CHECK`.

**Notable columns:**

- `energy_consumption.consumption_mwh` — generated stored column (`kwh / 1000`).
- `regional_energy_data.total_consumption_twh` — generated stored column.
- `energy_consumption.data_classification` — ACTUAL / ESTIMATED / DEMO.
- `energy_consumption.source_provenance` — e.g. `USER_BILL_OCR`, `USER_CONFIRMED_BILL`, `BESCOM_OPEN_DATA`.
- `electricity_bills.raw_ocr_metadata` — JSONB with extraction evidence and user confirmation.

**RLS model:**

- Access is tied to `auth.uid()` = `profiles.id`.
- Organization access requires a matching `organization_members` row; there is no role granularity (OPERATOR ≡ OWNER).
- Government admins can read broadly via `is_government_admin()`.
- Helper functions are `SECURITY DEFINER` with a pinned `search_path` in the trigger fix.
- Signup trigger `handle_new_user()` creates a profile; industrial role allowed, government never self-registers.

**Migration 009 (`009_fix_rls_onboarding.sql`) addresses self-service onboarding and storage isolation:**

- Adds `organizations.created_by` plus a trigger/backfill so the creator is recorded.
- Adds INSERT policies for `organizations` (creator must equal `auth.uid()`) and `organization_members` (creator self-insert as OWNER, or an existing manager via `is_org_manager`).
- Adds `is_org_manager(uuid)` and `try_uuid(text)` SECURITY DEFINER helpers.
- Replaces bucket-wide `electricity-bills` policies with path isolation:
  `{user_id}/consumer/{timestamp}_{file}` and `{user_id}/industrial/{organization_id}/{timestamp}_{file}`.
  Every policy requires `auth.uid()::text = (storage.foldername(name))[1]`; industrial paths additionally require org membership.
- `storageService` writes exactly these paths.
- **Applied to the hosted project** (verified 2026-11-06: `organizations.created_by`, `try_uuid`, and `is_org_manager` exist and behave correctly). Storage policies cannot be inspected through the API; confirm them under Dashboard → Storage → Policies.

**Migration 010 (`010_restrict_profile_reads.sql`):** completed locally, not yet applied. Restricts profile reads to active own-profile or government-admin access, removes client profile INSERT, grants UPDATE only on name/phone/organization/timestamp columns, verifies organization membership, and removes the recursive role subquery. Trusted signup and service-role provisioning retain INSERT access; profile creation failures roll back signup. Role/membership helpers use active profiles and pinned search paths. Legacy bucket-wide storage policies are dropped so migration 009 path isolation applies. Run it in Supabase SQL Editor after legacy scripts; the publishable-key probe still reads five profiles anonymously until it is applied.

**Remaining RLS gaps:**

1. No INSERT policies for `demand_forecasts`, `anomaly_alerts`, `ai_recommendations` → requires service role.
2. No UPDATE/DELETE for most reference tables; facilities/machines lack update/delete.
3. `profiles` is readable when `auth.uid()` is null (anonymous) and has a permissive INSERT policy.
4. No `updated_at` maintenance trigger.

**Reference seed:** `seed_demo_data.sql` seeds only reference data (data sources, carbon factors, 5 tariff configs + slabs, 4 regional rows, 3 challenges). It does **not** seed users, organizations, facilities, bills, consumption, or anomalies.

---

## 9. Frontend

### 9.1 Routes

| Path | Layout | Guard |
|---|---|---|
| `/` | Public | none |
| `/select-role` | none | none |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth | none |
| `/consumer` + `analytics`, `bills`, `forecast`, `tariffs`, `carbon`, `advisor`, `rewards`, `profile` | Dashboard | CONSUMER |
| `/industrial` + `facilities`, `analytics`, `machines`, `forecast`, `anomalies`, `optimization`, `carbon`, `reports`, `profile` | Dashboard | INDUSTRIAL |
| `/government` + `regional`, `sectors`, `trends`, `tariffs`, `policy-simulator`, `carbon`, `conservation`, `reports`, `admin` | Dashboard | GOVERNMENT |

`ProtectedRoute` shows a dashboard skeleton while auth loads, redirects unauthenticated users to `/login` with `state.from`, and sends wrong-role users to their own portal.

### 9.2 Service layer and fallbacks

`services/api.js`:

- Base URL: `VITE_API_BASE_URL` or `http://localhost:5000/api/v1`.
- 60 s timeout (upload: 120 s).
- Injects the Supabase Bearer token on every request.
- Unwraps `response.data` (services then use `response.data || response`).
- Maps HTTP/network failures to user-facing messages.

Every domain service except `billService` and `authService` has a mock fallback from `services/mockData.js` with `isDemo: true`. This keeps the demo usable without the backend, but means a failed API call can silently look like data — the UI shows "DEMO" markers for these.

### 9.3 Auth behavior

- Live mode: Supabase email/password; login and session restoration resolve the verified profile role through `GET /auth/me`. Database `GOVERNMENT_ADMIN` maps to UI `GOVERNMENT`.
- Login, signup with an immediate session, and restoration return the same verified profile shape. No role fallback to editable metadata is permitted.
- Auth callbacks defer profile requests until Supabase releases its session lock; stale requests cannot restore a user after logout. Logout errors are surfaced, and logout ends only the current browser session.
- Password recovery requires a valid session; successful password updates end that session. Demo mode cannot pretend to send recovery email or update a password.
- Demo mode (Supabase unconfigured): email substring decides role; session stored in `localStorage` as `wattwise_active_user`.
- The three prefilled accounts were provisioned in Supabase on 2026-11-06: `sarah.consumer@wattwise.ai` (CONSUMER), `marcus.industrial@wattwise.ai` (INDUSTRIAL), and `admin.gov@wattwise.ai` (GOVERNMENT_ADMIN). Password: `DemoPassword123!`.
- `npm run provision:demo` in `backend/` creates or updates exactly these accounts and verifies password sign-in and profile roles. It uses the server-only service-role key; it does not change other users.
- **Demo-only risk:** the public government password grants the database's broad government read access, including stored consumer bills. Disable that account or replace the public password before production.
- The unused client-side role switch and automatic demo authentication have been removed.

### 9.4 Design system

Enterprise, flat, data-dense. No glassmorphism, blur, gradients, pill shapes, or soft glow.

- Colors: ivory `#F4F0E6` background, white surfaces, charcoal `#151713` text/sidebar, cobalt `#2457F5` primary, slate borders (`slate-200` light / `slate-800` dark).
- Geometry: 2–6 px radii via Tailwind overrides (`rounded-full` is also capped at 4 px); hard 1 px borders; nav links and tags are squared, not pills.
- Shadows: none on cards; `shadow-xl` only for modals and charts-on-hover.
- Fonts: Plus Jakarta Sans for all UI text; JetBrains Mono reserved for numerics, metrics, IDs, and financial figures. `DataTable` auto-applies mono/tabular numerics.
- Components: `Card` (flat bordered header/body/footer), `Button` (flat, no glow), `Modal` (solid `slate-950/60` backdrop, no blur), `ConfirmDialog`, `Input`, `Select`, `DataTable` (dense `px-4 py-2.5`, zebra/borders), `StatCard` (mono metric), `LoadingSpinner`, `DashboardSkeleton`, `ChartWrapper`.
- Chart convention: `ChartWrapper` provides a fixed-height container; every Recharts chart inside it **must** be wrapped in `<ResponsiveContainer width="100%" height="100%">`. `ChartWrapper` detects an already-wrapped single child and does not double-wrap it.

### 9.5 Pages with real vs demo data

| Real (service-backed) | Hardcoded / demo |
|---|---|
| Consumer overview, analytics, bills, forecast, tariffs, carbon, AI advisor | Rewards, consumer profile save |
| Industrial overview, facilities, analytics, machines, anomalies, optimization, carbon, reports (CSV) | Industrial demand forecast, industrial profile save |
| Government overview, regional, sectors, tariffs, policy simulator, reports (CSV) | Government carbon, energy trends, conservation programs, admin settings |
| Grid monitor (live-or-static) | Recommendation copy and appliance splits in analytics |

---

## 10. Data sources and provenance

| Source | Used for | Notes |
|---|---|---|
| CEA CO₂ Baseline Database v19 | Emission factor 0.82 kg/kWh | Statutory reference in UI |
| CEA/NPP station-wise generation via CHETNA (Zenodo 21865308) | Industrial Karnataka benchmark | CC BY 4.0; 23 plants, FY 2018-19 → 2023-24 |
| BESCOM open data (opencity.in) | 13 annual DISCOM totals | Aggregate, not facility-level |
| KERC tariff orders | Tariff catalog | Static catalog, not live |
| User-uploaded bills | Consumption, cost, carbon | OCR + explicit confirmation |

No public dataset provides factory-level Karnataka consumption. Facility-level truth requires consented bills/meter data, DISCOM agreements, partner data, or IoT.

---

## 11. Configuration and running locally

**Backend**

```bash
cd backend
npm install
npm run dev        # node --watch src/server.js  → http://localhost:5000
npm start          # production-style
npm test           # 9 core + 10 parser + 8 API smoke checks
npm run import:bescom -- --dry-run   # CSV validation + SQL generation
```

**Frontend**

```bash
cd frontend
npm install
npm run dev        # Vite; config port 3001 (observed dev session on 3003)
npm run build      # vite build → dist/
```

**Database**

Apply `database/migrations/001…009`, then `FIX_SIGNUP_TRIGGER.sql` and `FIX_RLS_POLICIES.sql`, then `database/seed/seed_demo_data.sql`. Apply `database/seed/import_bescom_consumption.sql` only with a privileged role. Migration 009 must be applied for self-service organization onboarding and uid-scoped storage paths to work.

**Operational notes**

- Frontend proxy: `/api` → `http://localhost:5000`.
- Supabase URL/key have hardcoded fallbacks in both frontend and backend config; treat them as configuration debt.
- `frontend/dist` is committed.

---

## 12. Verification status (as of this date)

| Area | Status | Evidence |
|---|---|---|
| Backend unit/parser/smoke tests | ✅ Pass | `npm test`: 9 + 10 + 8 checks (rerun after RBAC/CSV changes) |
| Frontend production build | ✅ Pass | `npm run build` (2722 modules, built) |
| CSV report generation | ✅ Verified at service level | Industrial: 23 rows, benchmark flag true; Government: 8 rows; both emit CSV content |
| Role gates on industrial/government routes | ✅ Implemented | `requireRole` mounted per route; not yet exercised with real role JWTs |
| Migration 009 | ✅ Applied | `organizations.created_by`, `try_uuid`, `is_org_manager` verified; storage policies not API-inspectable |
| OCR live calls | ✅ Previously verified against four real bills | Net payable matched; warnings flagged; not a calibrated accuracy proof |
| Gemini primary model | ⚠️ Quota-limited today | `gemini-3.8-flash` valid but free-tier daily limit exhausted; fallback model responded |
| Authenticated end-to-end Supabase persistence | ⚠️ Not fully verified | Requires a real signed-in account; not yet run |
| BESCOM import | ✅ Imported | 13 rows, 243,646,360,000 kWh (matches CSV); RLS-hidden from publishable key |
| Service-role key | ✅ Verified | Auth admin + table access OK; API smoke tests pass with it configured |
| Industrial CEA/NPP benchmark | ✅ Verified | API + browser: 23 plants, 56,338,420 MWh, 39.8 Mt CO₂, PLF 46.6% |
| Industrial analytics | ✅ Verified | 46.6% PLF, 13,809 MW, 0.707 kg/kWh, populated chart |
| Industrial machines benchmark | ✅ Verified | 23 plants with unit counts/capacity |
| Carbon benchmark panel | ✅ Verified | Same totals, labelled as state generation |
| Demo accounts | ✅ Provisioned | Three confirmed Supabase users; password sign-in, profile roles, and API role restrictions verified |
| Portal login browser checks | ✅ Verified | All three portals reach the correct dashboard and survive refresh; local logout clears the session; a delayed profile response cannot undo logout; recovery without a session is blocked |
| Auth regressions | ✅ Verified | 29 backend smoke checks, 17 frontend auth tests, and frontend build pass; signup/password mutation branches use deterministic mocks, not delivered recovery emails |
| Migration 010 | ⚠️ Pending application | Profile grants, activation/role checks, atomic signup, storage isolation SQL completed; must be run in Supabase |

**Honest limitation:** OCR extracts and validates correctly on tested bills, but accuracy has not been measured across a representative bill corpus, and authenticated database persistence has not been proven end-to-end in this environment.

---

## 13. Security posture

**Good**

- Gemini key read from environment and used only server-side.
- Helmet, upload size cap, MIME + magic-byte validation, field name locked to `file`.
- Bill ownership enforced by RLS and service checks; demo users blocked from writes.
- User-scoped Supabase client forwards the JWT so RLS applies to routine reads.
- No fabricated OCR fallbacks; explicit confirmation before verification; storage rollback on DB failure.
- Bill contents and account numbers are not logged.

**Needs hardening**

1. Rotate `SUPABASE_SECRET_KEY` before production; it has been shared outside a secrets manager.
2. Hardcoded Supabase URL and publishable key as fallbacks in both apps.
3. Shared public government demo credentials grant broad read access; disable that account or replace its public password before production.
4. `profiles` anon-readable; permissive INSERT.
5. `frontend/.env` contains a publishable key; acceptable for Supabase but should not be treated as secret-free repo hygiene.

**Resolved in this pass**

- RBAC mounted on all industrial (`INDUSTRIAL`) and government (`GOVERNMENT_ADMIN`) routes.
- Zod validation on every POST/PATCH in those domains.
- CORS restricted to the `FRONTEND_ORIGIN` allow-list.
- Storage upload paths are `auth.uid()`-prefixed and migration 009 enforces path isolation.
- Organization onboarding INSERT policies authored in migration 009.
- Simulated report downloads replaced with real CSV blob downloads.
- Service-role key configured server-side; used only by the BESCOM importer and demo-account provisioning script, not routine requests.
- Migration 009 applied to the hosted project.

---

## 14. Known gaps and prioritized next steps

**P0 — unblock core persistence**

1. Verify signup → org → facility → bill → confirm end-to-end with a real account (migration 009 and the service-role key are in place).
2. Confirm a live Gemini extraction after quota resets (primary model is corrected; the fallback is exercised).
3. Rotate the service-role key before production.

**P1 — correctness and honesty**

4. Expose the imported BESCOM rows through a read-only public benchmark view (RLS hides them today) and surface them in the portals.
5. Replace the in-memory government tariff store with a DB-backed `tariff_configurations` write, or label it explicitly as a simulation.
6. Replace the hardcoded government pages and industrial demand forecast with benchmark-backed or clearly labelled demo data.
7. Extend the verified demo JWT role-gate checks to full onboarding and bill persistence end-to-end.

**P2 — hardening and polish**

8. Fix the remaining RLS gaps: `demand_forecasts`, `anomaly_alerts`, `ai_recommendations` insert policies; facilities/machines update/delete; anonymous `profiles` read.
9. Add `updated_at` triggers.
10. Add frontend tests and CI (lint, build, backend tests).
11. Remove hardcoded Supabase fallbacks; require env configuration.
12. Move Supabase secrets out of committed frontend config where possible (publishable key only).

---

## 15. Glossary

| Term | Meaning |
|---|---|
| BESCOM | Bangalore Electricity Supply Company (Karnataka DISCOM) |
| CEA | Central Electricity Authority (India) |
| NPP | National Power Portal (station-wise generation reports) |
| KERC | Karnataka Electricity Regulatory Commission |
| MU | Million Units (1 MU = 1,000,000 kWh) |
| PLF | Plant Load Factor (generation ÷ capacity × hours) |
| FPPCA | Fuel and Power Purchase Cost Adjustment |
| HT / LT | High Tension / Low Tension supply |
| RLS | Postgres Row Level Security |
| DISCOM | Distribution company |
| Eco-Rewards | Points awarded after a bill is successfully verified and persisted |

---

## 16. One-paragraph summary

WattWise AI is a React + Express + Supabase energy platform with three role portals. Its strongest, verified asset is the bill pipeline: local PDF text first, deterministic BESCOM parsing and validation, Gemini only when needed, explicit user confirmation, and database-backed verification with rewards. The consumer experience is largely live; the industrial portal now displays a real, licensed Karnataka CEA/NPP generation benchmark with honest labeling until user facility data exists; industrial and government report buttons produce real CSV exports from the current dataset. RBAC, Zod validation, strict CORS, and uid-scoped storage paths are implemented; migration 009 is applied, the service-role key is configured for the importer and demo-account provisioning only, and the 13 BESCOM annual rows are imported (RLS-hidden until exposed through a public benchmark view). The government portal remains substantially presentation data.
