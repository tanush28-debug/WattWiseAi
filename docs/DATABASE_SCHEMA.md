# WattWise AI — Database Schema Specification

## 1. Overview
The database schema is designed for PostgreSQL on Supabase. It supports **Consumers**, **Industries**, and **Government Regulators** with strict Row Level Security (RLS) and audit traceability.

---

## 2. Table Summary (18 Tables)

| # | Table Name | Purpose | Primary Key | Key Relationships |
|---|---|---|---|---|
| 1 | `profiles` | User profiles with verified roles | UUID | `auth.users(id)` |
| 2 | `organizations` | Industrial facilities parent entity | UUID | - |
| 3 | `organization_members` | Membership & role in an industrial org | UUID | `organizations(id)`, `profiles(id)` |
| 4 | `facilities` | Industrial plants, factories, cold storages | UUID | `organizations(id)` |
| 5 | `machines` | Machine registry (kW rating, duty cycle) | UUID | `facilities(id)` |
| 6 | `electricity_bills` | Uploaded bill metadata & extracted values | UUID | `profiles(id)`, `organizations(id)` |
| 7 | `energy_consumption` | Normalized consumption (kWh, MWh, TWh) | UUID | `profiles(id)`, `facilities(id)`, `bills(id)` |
| 8 | `tariff_configurations` | DISCOM statutory tariff structures | UUID | - |
| 9 | `tariff_slabs` | Tiered kWh rate slabs & ToD windows | UUID | `tariff_configurations(id)` |
| 10 | `carbon_emission_factors`| Grid emission metrics (kg CO₂e/kWh) | UUID | - |
| 11 | `demand_forecasts` | ML load curve projections & bands | UUID | `profiles(id)`, `facilities(id)` |
| 12 | `anomaly_alerts` | Industrial equipment deviation alerts | UUID | `facilities(id)`, `machines(id)` |
| 13 | `ai_recommendations` | Contextual energy conservation actions | UUID | `profiles(id)`, `organizations(id)` |
| 14 | `reward_accounts` | Consumer gamification points & tier | UUID | `profiles(id)` |
| 15 | `reward_transactions` | Points ledger history | UUID | `reward_accounts(id)` |
| 16 | `conservation_challenges`| Active eco-challenges | UUID | - |
| 17 | `regional_energy_data` | National grid telemetry (NR, WR, SR, ER)| UUID | - |
| 18 | `data_sources` | Statutory provenance (CEA, KERC, BESCOM)| UUID | - |
| 19 | `audit_logs` | Immutable audit trail for governance | UUID | `profiles(id)` |

---

## 3. Key Enums

- **`user_role`**: `'CONSUMER'`, `'INDUSTRIAL'`, `'GOVERNMENT_ADMIN'`
- **`bill_status`**: `'PENDING'`, `'PROCESSING'`, `'EXTRACTED'`, `'VERIFIED'`, `'FAILED'`
- **`anomaly_severity`**: `'LOW'`, `'MEDIUM'`, `'HIGH'`, `'CRITICAL'`

---

## 4. Role Authorization Rule

> [!IMPORTANT]
> A user's verified role is determined **exclusively** by the `public.profiles` table. User-editable metadata (`auth.users.raw_user_meta_data`) is never trusted by the backend. The `handle_new_user()` trigger explicitly prevents public self-registration as `GOVERNMENT_ADMIN`.

