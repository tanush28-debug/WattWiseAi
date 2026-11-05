# WattWise AI — Frontend

> **Understand Energy. Reduce Waste. Build a Sustainable Future.**  
> An intelligent energy-management and decision-support SaaS platform for **Consumers**, **Industries**, and **Government Regulators**.

---

## ⚡ Tech Stack

- **Framework:** React 18 (JavaScript JSX)
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Strict Design System: Soft Ivory `#F4F0E6`, Midnight Black `#151713`, Neon Lime `#C6FF4D`)
- **Routing:** React Router DOM (v6)
- **Visualizations:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Auth & Database Client:** Supabase JS SDK (`@supabase/supabase-js`)
- **HTTP Client:** Axios (Centralized API client with JWT Bearer token interception)

---

## 🎨 Design System

| Element | Color Hex | Usage |
| :--- | :--- | :--- |
| **Soft Ivory** | `#F4F0E6` | Main workspace background, cards, light surfaces |
| **Midnight Black** | `#151713` | Sidebar, dark navigation, header badges, strong contrast |
| **Neon Lime** | `#C6FF4D` | Primary action buttons, active navigation, key data highlights |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your actual Supabase URL and Node.js Express backend URL:
```env
VITE_SUPABASE_URL=https://vxvgrtyvnulgnpcaadry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_WpFw-SjHnKMG639HhtPHaw_R3jVrBTq
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

*Note:* If Supabase or the Express backend is not yet started, the frontend automatically falls back to **isolated mock services** with clear `DEMO` banners so all pages, charts, bill extractions, and simulators can be interactively reviewed.

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📂 Architecture Overview

```text
frontend/
├── src/
│   ├── assets/              # Static media & illustrations
│   ├── components/
│   │   ├── common/          # Button, Input, Select, Modal, ConfirmDialog, DataTable, StatCard, Badge, etc.
│   │   ├── layout/          # Sidebar, Navbar, PublicNavbar, PublicFooter
│   │   └── charts/          # ChartWrapper, ConsumptionChart, ForecastChart, CostBreakdownChart
│   ├── config/              # Constants, Navigation items, Role permissions
│   ├── contexts/            # AuthContext, ToastContext
│   ├── layouts/             # PublicLayout, AuthLayout, DashboardLayout
│   ├── pages/
│   │   ├── public/          # LandingPage
│   │   ├── auth/            # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   │   ├── consumer/        # Overview, Analytics, Bill OCR, Forecast, Tariff Sim, Carbon, AI Advisor, Rewards, Profile
│   │   ├── industrial/      # Overview, Facilities, Analytics, Machines, Forecast, Anomalies, Optimization, Reports, Profile
│   │   └── government/      # National, Regional, Sectors, Trends, Tariffs, Policy Sim, Carbon, Programs, Reports, Admin
│   ├── routes/              # AppRoutes, ProtectedRoute (verified backend role gating)
│   ├── services/            # api.js (Axios), supabaseClient.js, authService, billService, tariffService, aiService, etc.
│   ├── styles/              # index.css (Tailwind layers & custom tokens)
│   └── utils/               # Formatters (kWh, currency, CO2, dates, account masking)
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🔐 Express Backend Integration Flow

1. User signs in via Supabase Auth (or quick Evaluator Presets).
2. Frontend extracts the active session token `access_token`.
3. Centralized Axios interceptor (`src/services/api.js`) automatically appends:
   ```http
   Authorization: Bearer <supabase_access_token>
   ```
4. Express backend verifies the JWT via Supabase Auth and validates verified roles (`CONSUMER`, `INDUSTRIAL`, `GOVERNMENT_ADMIN`).
5. In development/offline mode, isolated mock services provide data with `DEMO` badges without breaking the UI.

---

## ⚡ Hackathon Evaluator Quick Switcher

For judge reviews:
1. In the **Sign In** screen, 3 one-click preset buttons allow instant login as:
   - **Consumer** (`sarah.consumer@wattwise.ai`)
   - **Industrial Director** (`marcus.industrial@wattwise.ai`)
   - **Government Admin** (`admin.gov@wattwise.ai`)
2. Once logged in, the top navigation bar features an active **Portal Switcher** dropdown to toggle between all 3 portals instantly without logging out.

