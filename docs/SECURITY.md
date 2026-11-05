# WattWise AI — Application Security Model

## 1. Authentication & JWT Integrity
- **Identity Provider:** Supabase Auth is the single identity provider.
- **Server-Side Verification:** The Node.js Express backend validates every Bearer token directly using Supabase Auth (`supabase.auth.getUser()`).
- **No Client Trust:** Client-supplied metadata or user roles in headers are never trusted.

---

## 2. Role-Based Access Control (RBAC)
- **Role Authority:** The `public.profiles` table is the sole authoritative source of truth for verified roles.
- **Trigger Protection:** The `handle_new_user()` trigger enforces that self-registrations can only be `CONSUMER` or `INDUSTRIAL`. `GOVERNMENT_ADMIN` accounts cannot be self-registered.
- **Backend Middleware:** Protected endpoints are guarded by `requireRole('CONSUMER')`, `requireRole('INDUSTRIAL')`, or `requireRole('GOVERNMENT_ADMIN')`.

---

## 3. PostgreSQL Row Level Security (RLS)
- RLS is enabled on all 18 tables in `public`.
- **Consumer Isolation:** Consumers can only SELECT, INSERT, and DELETE their own records where `profile_id = auth.uid()`.
- **Industrial Multi-Tenancy:** Industrial users can only access facilities, machines, bills, and anomalies belonging to organizations in which they are verified members (`is_member_of_org(org_id)`).
- **Government Restriction:** Privileged regional data and statutory tariff edits require `is_government_admin()`.

---

## 4. Private Storage Security
- The `electricity-bills` bucket has public access disabled.
- Object paths are strictly segmented:
  - Consumer bills: `consumer/{auth.uid()}/{timestamp}_{filename}`
  - Industrial bills: `industrial/{orgId}/{timestamp}_{filename}`
- Storage RLS policies prevent users from viewing, downloading, or deleting other users' bills.
- Temporary signed URLs (60-minute expiration) are used for authorized previews.

---

## 5. Secret Protection
- Publishable key (`sb_publishable_...`) is safe for frontend browser use with RLS enabled.
- No Supabase secret keys or Gemini API keys are exposed to the browser or committed to version control.
- All `.env` and `.env.local` files are ignored via `.gitignore`.

