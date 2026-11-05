# WattWise AI — System Architecture Specification

## 1. Executive Summary

**WattWise AI** is an intelligent energy-management and decision-support SaaS platform designed for **Consumers** (residential households), **Industries** (manufacturing facilities & plants), and **Government Administrators** (statutory energy regulators & policy makers).

The platform operates entirely via software telemetry, user input, and uploaded electricity bills. **Zero IoT hardware or smart-meter dependencies are required.**

---

## 2. High-Level Technology Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Browser)                         │
│   React 18 + Vite 5 + Tailwind CSS + Framer Motion + Recharts + Lucide  │
│   • Consumer Portal  • Industrial Portal  • Government Hub              │
│   • Single App-Wide Supabase Auth Session Persistence                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    HTTP REST API    │   Authorization: Bearer <JWT>
                    Port 5000 /api/v1│
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND APPLICATION TIER                        │
│                   Node.js LTS + Express 5 (ES Modules)                  │
│                                                                         │
│   Middleware:                                                           │
│   • Helmet (Security Headers)       • CORS Origin Control               │
│   • Supabase Auth JWT Verification  • Verified Profile Role Check (RBAC)│
│   • Multer (15 MB Private Uploads)  • Zod Payload Validation            │
│                                                                         │
│   Engines:                                                              │
│   • Deterministic Tariff Engine (BESCOM / India DISCOMs)                │
│   • Carbon Emission Calculation (CEA Grid Factor 0.82 kg CO2/kWh)       │
│   • Gemini AI Advisor Client (Prepared for multi-turn advisory)         │
│   • Private Storage Coordinator (Signed temporary URLs)                 │
└──────────────────┬───────────────────────────────────┬──────────────────┘
                   │ User-Scoped Client (RLS)          │
                   ▼                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│       DATABASE & AUTH TIER           │  │       STORAGE BUCKET          │
│        Supabase PostgreSQL           │  │      Supabase Storage         │
│                                      │  │                               │
│  • 18 Normalized Domain Tables       │  │  • 'electricity-bills' bucket │
│  • Row Level Security (RLS) Enabled  │  │  • Private access only        │
│  • Automated Profile Creation Trigger│  │  • Path: consumer/{id}/...    │
│  • Non-repudiable Audit Logs         │  │  • Path: industrial/{org}/... │
└──────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 3. Core Component Responsibilities

### 3.1 Frontend (`frontend/`)
- Single Page Application built on React 18, Vite 5, Tailwind CSS.
- Adheres to the strict 3-color design system:
  - **Soft Ivory (`#F4F0E6`)**: Main workspace and cards.
  - **Midnight Black (`#151713`)**: Sidebars, dark navigation, typography.
  - **Electric Cobalt Blue (`#2457F5`)**: Primary buttons, active highlights, key metrics.
- Multi-portal role authorization enforced via `ProtectedRoute.jsx` and `AuthContext.jsx`.
- Axios interceptor automatically attaches the user's active Supabase session token to all outbound API calls.

### 3.2 Backend (`backend/`)
- Express 5 application listening on port `5000` with `/api/v1` base route.
- Intercepts requests, validates the Supabase JWT using `supabase.auth.getUser()`, and loads the verified role from `public.profiles`.
- Implements deterministic, non-hallucinatory business calculations for Indian DISCOM tariffs, fuel surcharges (FPPCA), electricity duties, and CEA carbon baselines.

### 3.3 Database (`database/`)
- Hosted on Supabase PostgreSQL (Project ID: `vxvgrtyvnulgnpcaadry`).
- 18 normalized tables with UUID primary keys, foreign keys, timestamps, and indexes.
- Strict Row Level Security (RLS) on all user-facing tables.

### 3.4 Private Storage (`electricity-bills`)
- Supabase Storage bucket configured as strictly private.
- Uploads scoped by user ID (`consumer/{userId}/...`) and organization ID (`industrial/{orgId}/...`).

