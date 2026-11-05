# WattWise AI — Setup and Execution Guide

## Prerequisites
- Node.js LTS (v18+ or v20+ or v24+)
- npm (v9+)
- A web browser (Google Chrome, Firefox, Microsoft Edge)

---

## 1. Quick Start: Running Frontend and Backend

### Terminal 1: Start Express Backend
```bash
cd backend
npm install
npm start
```
*The Express server runs on `http://localhost:5000`.*  
Verify by visiting: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

### Terminal 2: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server runs on `http://localhost:3001`.*  
Open your browser at: [http://localhost:3001/](http://localhost:3001/)

---

## 2. Applying Database Migrations (Supabase Dashboard)

Since the database is hosted on the existing Supabase project (`vxvgrtyvnulgnpcaadry`), migrations can be applied via the Supabase SQL Editor:

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/vxvgrtyvnulgnpcaadry).
2. Navigate to **SQL Editor** in the left sidebar.
3. Open and run the migration files from the `database/migrations/` folder in this exact sequence:
   - `001_create_enums_and_profiles.sql`
   - `002_create_organizations_and_facilities.sql`
   - `003_create_bills_and_consumption.sql`
   - `004_create_tariffs_and_carbon.sql`
   - `005_create_forecasts_anomalies_ai.sql`
   - `006_create_rewards_and_regional.sql`
   - `007_row_level_security.sql`
   - `008_storage_policies.sql`
4. Run the seed data script:
   - `database/seed/seed_demo_data.sql`

---

## 3. Creating the Private Storage Bucket

In the Supabase Dashboard:
1. Go to **Storage**.
2. Click **New Bucket**.
3. Name: `electricity-bills`.
4. Ensure **Public bucket** is toggled **OFF** (strictly private).
5. Allowed MIME types: `application/pdf, image/png, image/jpeg, image/jpg`.
6. Maximum file size: `15 MB`.

