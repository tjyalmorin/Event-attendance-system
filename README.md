# PrimeLog — Full System Context README
> **For AI Assistants:** This document gives you complete context on the PrimeLog system — a QR-based event attendance tracking system for PRU Life UK (A1 Prime Branch). Read every section to understand the full codebase, all pages, all backend functionality, and all DB tables before responding. This is the single source of truth — attach this instead of individual files.

---

## 🧭 Project Overview

**PrimeLog** is a web-based event attendance management system built for PRU Life UK's internal events. It automates event registration, agent code-based check-ins/check-outs, and provides real-time analytics and override tooling.

- **Client:** PRU Life UK — A1 Prime Branch
- **Supervisor:** Mr. Jayson Frias Vitalicio
- **Target Deployment:** March 28, 2026
- **Lead Developer:** Thomas Joseph Almorin

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark mode via `class`) |
| HTTP Client | Axios with interceptors |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Supabase (`pg` pool, port 6543, SSL) |
| Caching | Redis (ioredis) — optional, degrades gracefully |
| Auth | JWT (8h expiry) |
| File Storage | Cloudinary (agent photos via `agents` table), local disk (event posters in `uploads/posters/`) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod (server-side) |

> ⚠️ **Database is Supabase (not local).** `server/src/config/database.ts` hardcodes the Supabase pooler connection. Local `.env` DB vars are commented out. Password: `Primeloga1prime`.

---

## 🎨 UI Design System

| Token | Value |
|-------|-------|
| Primary color | Crimson `#DC143C` |
| Page background (light) | `#f0f1f3` |
| Page background (dark) | `#0f0f0f` |
| Card background (light) | `#ffffff` |
| Card background (dark) | `#1c1c1c` |
| Border (light) | `#e5e7eb` |
| Border (dark) | `#2a2a2a` |
| Header height | `76px` with `px-12` padding |
| Font style | `font-extrabold` titles with crimson period accent (e.g., `Event.Management`) |
| Filter pills | `rounded-full` with solid crimson active state |
| Dark mode | Toggled via `DarkModeContext`, persisted in `localStorage` |

---

## 🗂 Project Structure

```
QR-event-attendance-system/
├── client/                        # React + TypeScript frontend (Vite)
│   └── src/
│       ├── api/                   # All Axios API call functions
│       │   ├── axios.ts           # Axios instance + auth interceptor + 401 redirect
│       │   ├── auth.api.ts        # login, getMe, sendOtp, verifyOtp, resetPassword
│       │   ├── events.api.ts      # CRUD events, trash, archive, staff management
│       │   ├── participants.api.ts# register, get, cancel, label, trash/restore
│       │   ├── scan.api.ts        # lookup, resolve, scan, sessions, logs, bulk checkout
│       │   ├── users.api.ts       # CRUD users, profile, password, toggle active
│       │   ├── branches.api.ts    # CRUD branches and teams
│       │   ├── override.api.ts    # fixCheckin, forceCheckout, earlyOut, override logs
│       │   └── admin-grant.api.ts # grant/revoke/get admin access
│       ├── components/
│       │   ├── Sidebar.tsx        # Collapsible persistent sidebar with dark mode + logout
│       │   └── EditEventModal.tsx # Full event edit modal with date/time pickers
│       ├── contexts/
│       │   ├── DarkModeContext.tsx # isDarkMode, toggleDarkMode — persisted in localStorage
│       │   └── SidebarContext.tsx  # isCollapsed, toggleCollapsed — persisted in localStorage
│       ├── hooks/
│       │   ├── useBranches.ts     # Fetches + caches branches/teams (module-level cache)
│       │   └── useStaffProtection.ts # Disables screenshots, right-click, copy for staff role
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AccountManagement.tsx      # Admin-only: user CRUD, toggle active, reset password
│       │   │   ├── AdminLogin.tsx             # Login page (email + password → JWT)
│       │   │   ├── BranchManagement.tsx       # Admin-only: branch + team CRUD
│       │   │   ├── CreateEvent.tsx            # Create new event with branches, staff, poster
│       │   │   ├── EventArchive.tsx           # Archived events list with restore option
│       │   │   ├── EventDetail.tsx            # Single event: participants, sessions, logs tabs
│       │   │   ├── EventDetailTabs.tsx        # Tab navigation component for EventDetail
│       │   │   ├── EventManagement.tsx        # Main dashboard: all events with filter + search
│       │   │   ├── ForgotPasswordPage.tsx     # Step 1: enter admin email → send OTP
│       │   │   ├── ProfileSettingsPage.tsx    # Edit own profile + change password
│       │   │   ├── ResetPasswordPage.tsx      # Step 3: set new password after OTP verified
│       │   │   ├── ScannerPage.tsx            # Check-in/check-out scanner interface
│       │   │   ├── TrashBin.tsx               # Soft-deleted events + cancelled participants
│       │   │   └── VerifyOtpPage.tsx          # Step 2: enter 6-digit OTP from email
│       │   └── client/
│       │       ├── ConfirmationPage.tsx       # Post-registration confirmation screen
│       │       └── RegistrationPage.tsx       # Public self-registration form for participants
│       ├── types/index.ts         # All TypeScript interfaces (User, Event, Participant, etc.)
│       └── App.tsx                # Route definitions + PrivateRoute wrapper
│
├── server/                        # Node.js + Express + TypeScript backend
│   └── src/
│       ├── config/
│       │   ├── database.ts        # Supabase PostgreSQL pool (hardcoded connection, Manila timezone)
│       │   ├── redis.ts           # Redis client with graceful fallback
│       │   └── cloudinary.ts      # Cloudinary v2 config
│       ├── database/
│       │   ├── migrate.ts         # Full DB migration (idempotent — safe to re-run)
│       │   ├── seed.ts            # Basic seed (admin + staff + sample event)
│       │   ├── seed.demo.ts       # 200+ participants across all branches with labels
│       │   ├── seed.mini.ts       # 5-participant minimal seed for dev
│       │   ├── seed.prime.ts      # Real A1 Prime March 2026 Branch Meeting data
│       │   └── seed.staff.ts      # Staff accounts (one per branch, password: Staff@1234)
│       ├── errors/AppError.ts     # AppError, ValidationError, NotFoundError, etc.
│       ├── middlewares/
│       │   ├── authenticate.ts    # JWT verify → req.user
│       │   ├── authorizeAdmin.ts  # Requires role = 'admin'
│       │   ├── roleGuard.ts       # Allows multiple roles (roleGuard('admin','staff'))
│       │   ├── adminGrantGuard.ts # Allows admin OR staff with valid admin_grants row
│       │   ├── validate.ts        # Zod schema validation middleware
│       │   ├── rateLimiters.ts    # authLimiter, scanLimiter, lookupLimiter, globalLimiter
│       │   ├── asyncHandler.ts    # Wraps async route handlers
│       │   ├── errorHandler.ts    # Global error handler (Zod + AppError + fallback 500)
│       │   └── upload.ts          # multer: memory storage (Cloudinary photos), disk (posters)
│       ├── routes/
│       │   ├── auth/              # login, getMe, OTP forgot password
│       │   ├── events/            # Full event CRUD, trash, archive, staff management
│       │   ├── participants/      # Register, list, cancel, label, trash
│       │   ├── scan/              # Lookup, resolve, scan, sessions, logs, bulk checkout
│       │   ├── users/             # User CRUD, profile, password, admin grants
│       │   ├── branches/          # Branch + team CRUD
│       │   └── override/          # Admin time correction overrides + logs
│       ├── schemas/               # Zod validation schemas for every route
│       ├── scripts/
│       │   └── assignPhotosCloudinary.mjs  # Bulk-upload agent photos → Cloudinary → agents table
│       ├── types/                 # TypeScript types (user, event, participant, override, branch)
│       ├── utils/cache.ts         # Redis helpers: cacheGet, cacheSet, cacheDel, TTL constants
│       └── server.ts              # Express app setup (helmet, CORS, static, routes, error handler)
└── docs/                          # Setup guides, commit conventions, TypeScript migration guide
```

---

## 🖥 Frontend Pages — Full List & Descriptions

### Route Map (App.tsx)

```
/register/:eventId          → RegistrationPage        (public)
/confirmation               → ConfirmationPage         (public)
/admin/login                → AdminLogin               (public)
/admin/forgot-password      → ForgotPasswordPage       (public)
/admin/verify-otp           → VerifyOtpPage            (public)
/admin/reset-password       → ResetPasswordPage        (public)
/admin/events               → EventManagement          (protected)
/admin/events/trash         → TrashBin                 (protected) ← MUST be before /:eventId
/admin/events/archive       → EventArchive             (protected) ← MUST be before /:eventId
/admin/events/create        → CreateEvent              (protected) ← MUST be before /:eventId
/admin/events/:eventId      → EventDetail              (protected)
/admin/events/:eventId/scanner → ScannerPage           (protected)
/admin/settings/profile     → ProfileSettingsPage      (protected)
/admin/settings/accounts    → AccountManagement        (protected)
/admin/settings/branches    → BranchManagement         (protected)
/staff/events               → EventManagement          (protected, staff view)
/staff/events/:eventId      → EventDetail              (protected, staff view)
/staff/events/:eventId/scanner → ScannerPage           (protected, staff view)
```

> ⚠️ **Route ordering is critical:** Static routes (`/trash`, `/archive`, `/create`) are defined BEFORE `/:eventId` in App.tsx to prevent React Router from treating them as event IDs.

---

### Public (Client) Pages — No Auth Required

#### `/register/:eventId` → `RegistrationPage.tsx`
- Public participant self-registration form
- Fields: Agent Code, Full Name, Agent Type (dropdown: District Manager / Area Manager / Branch Manager / Unit Manager / Agent), Branch Name (dropdown from `/api/branches`), Team Name (dynamic based on branch)
- Validates: event is open, within registration window, no duplicate agent code
- On success → redirects to `/confirmation`
- Shows event title, date, venue, and poster if available

#### `/confirmation` → `ConfirmationPage.tsx`
- Shown after successful registration
- Displays confirmation with participant details
- No QR image generated — agent code is used directly at scanner

---

### Admin Auth Pages — No Auth Required

#### `/admin/login` → `AdminLogin.tsx`
- Admin login form (email + password)
- On success: saves JWT to `localStorage` as `authToken`, saves user object as `user`
- Redirects to `/admin/events`
- Links to forgot password flow

#### `/admin/forgot-password` → `ForgotPasswordPage.tsx`
- Step 1 of password reset: enter admin email
- Sends 6-digit OTP via Gmail SMTP (valid 10 min)
- Only works for `role = 'admin'` users with `deleted_at IS NULL`

#### `/admin/verify-otp` → `VerifyOtpPage.tsx`
- Step 2: enter 6-digit OTP received via email
- Sets `otp_verified = TRUE` in DB on success

#### `/admin/reset-password` → `ResetPasswordPage.tsx`
- Step 3: set new password (8+ chars, uppercase + number)
- Clears OTP fields after reset

---

### Protected Admin Pages — JWT Required

All admin pages include the collapsible `Sidebar.tsx` on the left.

#### `/admin/events` → `EventManagement.tsx`
- Main dashboard — lists all events
- Admin sees all events; staff sees only assigned events (via `event_permissions`)
- Event cards show: title, date, venue, status badge, registered count
- Filter pills: All / Draft / Open / Closed / Completed
- Search bar filters by title
- Per-card actions: View Details, Edit (opens `EditEventModal`), Delete (soft delete with 10-second undo toast)
- Top-right buttons: Trash Bin, Archive, Create Event
- Status badge colors: Draft=gray, Open=green, Closed=orange, Completed=blue, Archived=purple
- Auto-refreshes every 30 seconds
- Full dark mode support

#### `/admin/events/create` → `CreateEvent.tsx`
- Form to create a new event
- Fields: Title, Description (optional), Event Date, Start Time, End Time, Venue, Check-in Cutoff
- Branch/team selector: multi-select which branches + teams can register
- Staff assignment: pick staff users per branch to assign to event
- Poster upload: optional image (JPG/PNG/WEBP, max 5MB) — saved to `uploads/posters/` (disk)
- Registration window: optional open/close datetime
- On submit → status = `draft`

#### `/admin/events/archive` → `EventArchive.tsx`
- Lists events with `status = 'archived'` (not soft-deleted)
- View-only list with restore option (returns to `closed` status via `POST /events/:id/restore-archive`)

#### `/admin/events/trash` → `TrashBin.tsx`
- Two tabs: Deleted Events | Cancelled Participants
- **Events tab:** soft-deleted events (`deleted_at IS NOT NULL`) — Restore or Permanent Delete
- **Participants tab:** cancelled participants per event — Restore (back to `confirmed`) or Permanent Delete
- Permanent delete of events cascades: scan_logs → attendance_sessions → participants → event_permissions → admin_grants → event_branches → events

#### `/admin/events/:eventId` → `EventDetail.tsx`
- Full detail view of a single event
- Header: event title, date, time, venue, status badge, registered count
- Tabs (via `EventDetailTabs.tsx`):

  **Participants tab:**
  - Table: Agent Code, Full Name, Branch, Team, Agent Type, Status, Registration Date, Label
  - Search by name/agent code; filter by branch, team, label, status
  - Actions: Cancel (soft delete → TrashBin), Set Label, View photo
  - Export to Excel (ExcelJS)
  - Bulk actions: select multiple → cancel or export

  **Sessions tab:**
  - Attendance sessions: participant name, check-in time, check-out time, method
  - Edit times (admin only) → opens time edit modal (calls `PATCH /attendance/sessions/:id/times`)
  - Bulk check-out: select checked-in sessions → `POST /attendance/sessions/:eventId/bulk-checkout`
  - Download sessions as Excel

  **Scan Logs tab:**
  - All scan events: check_in, check_out, denied
  - Shows denial reason, timestamp, agent code, name

  **Override Logs tab:**
  - All admin time corrections: original time, adjusted time, reason, admin name

- Event action buttons: Edit Event (opens `EditEventModal`), Open/Close Registration (PUT status), Archive Event, Manage Staff

#### `EventDetailTabs.tsx`
- Shared tab navigation used inside `EventDetail.tsx`
- Tabs: Participants | Sessions | Scan Logs | Override Logs
- Renders the correct content section based on active tab

#### `/admin/events/:eventId/scanner` → `ScannerPage.tsx`
- Check-in/check-out scanner interface
- Search box (agent code or name) with live lookup via `POST /attendance/lookup`
- Lookup returns participant card: photo (from `agents` table via JOIN), name, branch, team, label badge
- If multiple matches → disambiguation list → user picks one → `POST /attendance/resolve`
- Confirm identity → action button shows "CHECK IN" or "CHECK OUT"
- Early Out toggle: if checking out, can mark as early departure + reason
- Result feedback: full-screen green (check-in) or blue (check-out) confirmation card
- Denial logging: staff presses "Deny" → logs to scan_logs as `denied`
- Check-in cutoff enforced server-side: past cutoff returns error
- `useStaffProtection` hook active for `role = 'staff'`: disables screenshots, right-click, blur overlay

#### `/admin/settings/profile` → `ProfileSettingsPage.tsx`
- Edit own profile: Full Name, Branch Name, Team Name
- Change password: Current Password → New Password (8+ chars, uppercase + number)
- Shows current user info from `localStorage.user`

#### `/admin/settings/accounts` → `AccountManagement.tsx`
- Admin-only user management table
- Columns: Agent Code, Full Name, Email, Branch, Role, Status (Active/Inactive)
- Actions per row: Edit, Toggle Active/Inactive, Delete (soft), Reset Password
- Create New User modal: all fields including role
- Filter by role, search by name/email/agent code

#### `/admin/settings/branches` → `BranchManagement.tsx`
- Admin-only branch + team management
- Branch list expandable to show teams
- Add/Edit/Delete branches and teams
- All changes call `invalidateBranchCache()` → next hook call re-fetches fresh data

---

## 🔧 Backend API — Complete Endpoint Reference

Base URL: `http://localhost:5000/api`
Auth: `Authorization: Bearer <JWT>` for all protected routes

---

### Auth Routes `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login. Returns `{ token, user }`. Blocks `is_active = false`. Rate limited (15/15min prod). |
| GET | `/auth/me` | JWT | Returns current user from DB. |
| POST | `/auth/forgot-password` | None | Send OTP to admin email. Always returns success (security). |
| POST | `/auth/verify-otp` | None | Verify 6-digit OTP. Sets `otp_verified = TRUE`. |
| POST | `/auth/reset-password` | None | Reset password if `otp_verified = TRUE` and `otp_expires > NOW()`. |

---

### Events Routes `/api/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | JWT | Get all non-archived, non-deleted events. Admin sees all; staff sees only assigned. Includes `registered_count`. |
| POST | `/events` | Admin | Create event. `multipart/form-data` for poster. Saves `event_branches`, assigns staff. Status = `draft`. |
| GET | `/events/trash` | Admin | Get soft-deleted events (`deleted_at IS NOT NULL`). |
| GET | `/events/archived` | Admin | Get archived events (`status = 'archived'`). |
| GET | `/events/:event_id` | None (Public) | Get single event with `registered_count` and `event_branches`. Used by RegistrationPage. |
| PUT | `/events/:event_id` | Admin | Update event. Supports `multipart/form-data` for poster. Replaces `event_branches` and `event_permissions` if provided. |
| DELETE | `/events/:event_id` | Admin | Soft delete (`deleted_at = NOW()`). |
| POST | `/events/:event_id/restore` | Admin | Restore soft-deleted event. If status was `archived`, resets to `closed`. |
| POST | `/events/:event_id/restore-archive` | Admin | Restore archived event to `closed` status. |
| DELETE | `/events/:event_id/permanent` | Admin | Cascade delete all related data. Only works if `deleted_at IS NOT NULL`. |
| POST | `/events/:event_id/permissions` | Admin | Assign staff user to event. |
| GET | `/events/:event_id/admin-grants` | Admin | Get all admin grants for event. |
| GET | `/events/:event_id/staff` | Admin | Get all staff assigned to event. |
| DELETE | `/events/:event_id/staff/:user_id` | Admin | Remove staff from event. |
| GET | `/events/:event_id/participants/cancelled` | Admin | Get cancelled (trashed) participants for TrashBin. |

---

### Participants Routes `/api/participants`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/participants/register/:event_id` | None | Public self-registration. Validates event open, window, no duplicate agent_code. Does NOT copy photo_url — resolved live from `agents` table at query time. |
| GET | `/participants/event/:event_id` | JWT | Get participants. JOINs `agents` table for `photo_url`. Admin sees all; staff sees only their branch. |
| DELETE | `/participants/:participant_id` | Admin | Soft cancel (`registration_status = 'cancelled'`, `deleted_at = NOW()`). |
| POST | `/participants/:participant_id/photo` | Admin | Upload photo to Cloudinary. Updates `agents` table by `agent_code` (not participants directly). |
| PATCH | `/participants/:participant_id/label` | Admin, Staff | Set label string (e.g., "Awardee", "VIP") + optional description. `null` clears it. |
| PATCH | `/participants/:participant_id/restore` | Admin | Restore cancelled participant back to `confirmed`. |
| DELETE | `/participants/:participant_id/permanent` | Admin | Permanently delete cancelled participant + scan_logs + attendance_sessions. |

---

### Attendance / Scan Routes `/api/attendance`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/attendance/lookup` | JWT | Search by agent code (numeric, partial match) or full name (ILIKE). Returns single or disambiguation list. Enforces `checkin_cutoff`. JOINs `agents` for `photo_url`. |
| POST | `/attendance/resolve` | JWT | Resolve specific participant after disambiguation. Returns `next_action` (check_in / check_out / blocked). |
| POST | `/attendance/scan` | JWT | Perform check-in or check-out. Creates/updates `attendance_sessions`. Supports `is_early_out` flag. Logs to `scan_logs`. |
| POST | `/attendance/deny` | JWT | Log a denial scan (identity mismatch) to `scan_logs`. |
| GET | `/attendance/sessions/:event_id` | JWT | Get all attendance sessions with participant details. |
| GET | `/attendance/logs/:event_id` | JWT | Get all scan logs for event. |
| PATCH | `/attendance/sessions/:session_id/times` | Admin | Update check-in and/or check-out time. Validates check_out > check_in. |
| POST | `/attendance/sessions/:event_id/bulk-checkout` | Admin | Bulk check-out by session ID array. Only affects sessions with check_in but no check_out. Method = `bulk_admin`. |

---

### Users Routes `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | Get all non-deleted users. |
| POST | `/users` | Admin | Create user. Validates unique email + agent code. Hashes password (bcrypt, 10 rounds). |
| PUT | `/users/:user_id` | Admin | Partial update user fields. |
| PATCH | `/users/:user_id/active` | Admin | Toggle `is_active`. Deactivated users blocked at login. |
| DELETE | `/users/:user_id` | Admin | Soft delete (`deleted_at = NOW()`). |
| PUT | `/users/:user_id/reset-password` | Admin | Force-reset password. |
| PUT | `/users/profile` | JWT | Update own profile (full_name, branch_name, team_name). |
| PUT | `/users/change-password` | JWT | Change own password (requires `currentPassword`). |
| GET | `/users/staff-by-branches` | JWT | Get staff filtered by branch names. Query: `?branches=A1 Prime,Alexandrite 1`. |
| POST | `/users/admin-grant` | Admin | Grant temporary admin access to staff for event (expires at event end time). |
| GET | `/users/admin-grants/me` | JWT | Get own active admin grants. |
| DELETE | `/users/admin-grant/:grant_id` | Admin | Revoke admin grant (sets `revoked_at = NOW()`). |

---

### Branches Routes `/api/branches`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/branches` | JWT | Get all branches with teams. Cached in Redis (1hr TTL). |
| POST | `/branches` | Admin | Create branch. Invalidates cache. |
| PUT | `/branches/:branch_id` | Admin | Update branch name. Invalidates cache. |
| DELETE | `/branches/:branch_id` | Admin | Delete branch + cascades to teams. |
| GET | `/branches/:branch_id/teams` | JWT | Get teams for branch. |
| POST | `/branches/:branch_id/teams` | Admin | Create team. |
| PUT | `/branches/teams/:team_id` | Admin | Update team name. |
| DELETE | `/branches/teams/:team_id` | Admin | Delete team. |

---

### Override Routes `/api/override`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/override/fix-checkin` | Admin | Fix wrong check-in time OR create manual check-in (`session_id = 0` = new session). Logs to `override_logs`. |
| POST | `/override/force-checkout` | Admin | Force check-out on session with no `check_out_time`. Method = `admin_override`. |
| POST | `/override/early-out` | Admin | Mark check-out as early departure with `early_out_cutoff`. Method = `early_out`. |
| GET | `/override/logs/:event_id` | Admin | Get all override logs with participant + admin names. |

---

## 🗄 Database Schema — All Tables

> Database: Supabase PostgreSQL. All timestamps are `TIMESTAMPTZ`. Manila timezone set per connection.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK | `gen_random_uuid()` |
| agent_code | VARCHAR(50) UNIQUE | nullable |
| full_name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | bcrypt 10 rounds |
| branch_name | VARCHAR(255) | |
| team_name | VARCHAR(255) | |
| role | VARCHAR(50) NOT NULL | `admin` or `staff` |
| is_active | BOOLEAN DEFAULT TRUE | `false` blocks login |
| otp_code | VARCHAR(6) | for forgot-password flow |
| otp_expires | TIMESTAMPTZ | 10-minute window |
| otp_verified | BOOLEAN DEFAULT FALSE | must be true before reset |
| created_at / updated_at | TIMESTAMPTZ | auto-managed by trigger |
| deleted_at | TIMESTAMPTZ | soft delete |

### `agents`
**New table — single source of truth for agent photos.**
| Column | Type | Notes |
|--------|------|-------|
| agent_code | VARCHAR(50) PK | matches `participants.agent_code` |
| photo_url | VARCHAR(500) | Cloudinary URL |
| created_at / updated_at | TIMESTAMPTZ | |

> Photo is NOT stored on `participants`. It is resolved at query time via `LEFT JOIN agents a ON a.agent_code = p.agent_code`. Upload photo → writes to `agents`. All events for the same agent automatically show the photo. Script: `server/src/scripts/assignPhotosCloudinary.mjs`.

### `events`
| Column | Notes |
|--------|-------|
| event_id | SERIAL PK |
| created_by | UUID → users |
| title, description, venue | |
| event_date | DATE |
| start_time, end_time, checkin_cutoff | TIME |
| registration_start, registration_end | TIMESTAMPTZ |
| poster_url | VARCHAR(500) — path like `/uploads/posters/poster-xxx.jpg` |
| status | `draft` / `open` / `closed` / `completed` / `archived` |
| registration_link | VARCHAR(500) UNIQUE — UUID fragment used as public URL token |
| version | INT — incremented on every PUT |
| deleted_at | TIMESTAMPTZ — soft delete |

### `event_branches`
Links events to specific branches + teams for registration form filtering.
| Column | Notes |
|--------|-------|
| id | SERIAL PK |
| event_id | → events (ON DELETE CASCADE) |
| branch_name | VARCHAR(255) |
| team_names | TEXT[] — array of team names |
| UNIQUE (event_id, branch_name) | |

### `event_permissions`
Links staff users to events they can access.
| Column | Notes |
|--------|-------|
| permission_id | SERIAL PK |
| user_id | → users |
| event_id | → events |
| UNIQUE (user_id, event_id) | |

### `admin_grants`
Temporary admin elevation for staff users.
| Column | Notes |
|--------|-------|
| grant_id | SERIAL PK |
| granted_to_user_id / granted_by_user_id | → users |
| event_id | → events |
| is_edit_allowed | BOOLEAN |
| expires_at | Set to event `end_time` on `event_date` |
| revoked_at | Set when manually revoked |
| UNIQUE (granted_to_user_id, event_id) | |

### `participants`
| Column | Notes |
|--------|-------|
| participant_id | SERIAL PK |
| event_id | → events |
| agent_code | VARCHAR(50) |
| full_name, branch_name, team_name | |
| agent_type | VARCHAR(50) — `District Manager` / `Area Manager` / `Branch Manager` / `Unit Manager` / `Agent` |
| registration_status | `confirmed` or `cancelled` |
| registered_at | TIMESTAMPTZ |
| photo_url | VARCHAR(500) — **deprecated column, kept for compatibility; actual photo resolved from `agents` table** |
| label | VARCHAR(100) — e.g., `"Awardee"`, `"VIP"`, `"Speaker"` |
| label_description | TEXT |
| deleted_at | TIMESTAMPTZ — soft delete (used for cancelled) |

### `attendance_sessions`
One row per check-in event per participant per event.
| Column | Notes |
|--------|-------|
| session_id | SERIAL PK |
| participant_id / event_id | |
| check_in_time / check_out_time | TIMESTAMPTZ |
| check_in_method / check_out_method | `manual`, `early_out`, `bulk_admin`, `admin_override`, `manual_override` |
| early_out_reason | TEXT |
| early_out_recorded_by | UUID → users |

### `override_logs`
Audit trail for all admin time corrections.
| Column | Notes |
|--------|-------|
| override_id | SERIAL PK |
| attendance_session_id | → attendance_sessions (nullable — 0 or null = manual check-in creation) |
| participant_id / event_id / admin_id | → participants / events / users |
| override_type | `fix_checkin`, `force_checkout`, `early_out` |
| reason | TEXT — required |
| original_time / adjusted_time / early_out_cutoff | TIMESTAMPTZ |

### `scan_logs`
Raw log of every scan attempt.
| Column | Notes |
|--------|-------|
| scan_id | SERIAL PK |
| participant_id | nullable (logged even if participant not found) |
| event_id | → events |
| qr_token | agent_code used in scan |
| scan_type | `check_in`, `check_out`, `denied` |
| denial_reason | TEXT |
| scanned_at | TIMESTAMPTZ |

### `branches` + `teams`
Used by registration dropdowns and staff filtering.
| branches | teams |
|----------|-------|
| branch_id SERIAL PK | team_id SERIAL PK |
| name VARCHAR(255) UNIQUE | branch_id → branches (ON DELETE CASCADE) |
| | name VARCHAR(255) |
| | UNIQUE(branch_id, name) |

---

## 🔐 Auth & Role System

| Role | Access |
|------|--------|
| `admin` | Full access to all routes and all events |
| `staff` | Can only see events assigned via `event_permissions`. Cannot create events, manage users, or access settings pages. Participants tab filtered to own branch. |
| `admin_grant` | Staff with a row in `admin_grants` (not revoked, not expired) gains scanner-level access for their specific event only. |

**JWT Payload:** `{ user_id, role, branch_name }`
**Token expiry:** 8 hours
**Storage:** `localStorage.authToken` (frontend)
**Deactivated users:** `is_active = FALSE` — blocked at `loginService` before JWT is issued

---

## ⚙️ Key Frontend Mechanics

### Sidebar (`Sidebar.tsx`)
- Collapsible (persisted via `SidebarContext` → `localStorage.sidebarCollapsed`)
- Main nav items: Event Management (all roles), Account Management (admin only), Branch Management (admin only)
- Bottom: Dark Mode toggle, Profile Settings, Logout
- Active route highlighted with crimson background
- Width: `260px` expanded, `80px` collapsed

### DarkModeContext
- Adds/removes `dark` class on `<html>` element
- Persisted in `localStorage.darkMode`
- All components use Tailwind `dark:` variants

### Axios Interceptor (`axios.ts`)
- Auto-attaches `Authorization: Bearer <token>` header
- On 401 response AND not on a public route (`/register`, `/confirmation`) → clears localStorage + redirects to `/admin/login`
- Base URL: `/api` (proxied by Vite to `http://localhost:5000`)

### useBranches Hook
- Module-level cache (persists across re-renders but resets on page refresh)
- Returns `{ branches, branchNames, getTeamsForBranch, loading }`
- Call `invalidateBranchCache()` after any branch CRUD operation

### useStaffProtection Hook
- Active only for `user.role === 'staff'`
- Injects `<style>` tag to disable text selection and image drag globally
- Appends black `#staff-screenshot-shield` overlay that shows on:
  - `window blur` (snipping tool, Win+Shift+S)
  - `document visibilitychange` (tab switch, minimize)
  - `keydown PrintScreen`
- Blocks: right-click, Ctrl+C/A/S/P, Ctrl+Shift+S, PrintScreen, drag, copy
- Cleanup on unmount removes all event listeners and DOM elements

### EditEventModal (`components/EditEventModal.tsx`)
- Used by `EventManagement.tsx` and `EventDetail.tsx`
- Dirty-check on close: if any field changed, shows "Discard Changes?" confirm
- Sends `multipart/form-data` if poster file is selected, otherwise JSON
- Uses `react-datepicker` for all date/time pickers
- Sections: Basic Info → Schedule → Venue → Branches & Teams → Assign Staff → Advanced Settings
- Staff section only visible to admin and only when branches are selected

### PrivateRoute
- Checks for `localStorage.authToken`
- Redirects to `/admin/login` if not present

---

## 🚀 Running the System

```bash
# Backend (port 5000)
cd server
cp .env.example .env   # fill in JWT_SECRET, EMAIL_USER, EMAIL_PASS, Cloudinary keys
npm install
npm run db:migrate     # creates all tables, seeds SuperAdmin + branches
npm run dev            # tsx watch src/server.ts

# Frontend (port 5173)
cd client
npm install
npm run dev            # Vite dev server, proxies /api → localhost:5000
```

### Environment Variables (server/.env)
```env
PORT=5000
NODE_ENV=development
# DB vars in .env are currently unused — database.ts hardcodes Supabase connection
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=...         # Gmail for OTP
EMAIL_PASS=...         # Gmail app password
REDIS_URL=redis://localhost:6379
```

### Seed Commands
```bash
npm run db:seed           # Basic: admin + staff + sample event
npm run db:seed:demo      # 200+ participants across all branches with labels
npm run db:seed:mini      # 5 participants for quick testing
npm run db:seed:prime     # Real A1 Prime March 2026 data
npm run db:seed:staff     # 6 staff accounts (one per branch, password: Staff@1234)
```

### Default Credentials (after migration)
| Role | Email | Password |
|------|-------|----------|
| Admin | kurtrusselgliponeo@gmail.com | Admin@1234 |
| Demo Staff | norj@gmail.com | Staff@1234 |

---

## 🏢 Branch & Team Data

| Branch | Teams |
|--------|-------|
| Alexandrite 3 | Team Crisan, Team Jhainnie, Team Shai, Team Louis |
| A3 Axinite | Team Tony |
| A3 Goldstone | Team Claude, Team Jodel, Team Rechel, Team Roel, Team Sendi |
| A3 Phoenix Stone | Team Elvin, Team Feti, Team Jhen, Team Maan, Team Mark, Team Redge, Team Otchie |
| Alexandrite 1 | Team Alou, Team Dong, Team Henson, Team Isa, Team Nikki, Team Doris |
| A1 Prime | Team Norj, Team Donel, Team Paulyn, Team Esmael |

---

## 📦 Caching Strategy (Redis)

| Cache Key | TTL | Invalidated When |
|-----------|-----|-----------------|
| `branches:all` | 1 hour | Any branch/team CRUD |
| `events:list:admin` | 30s | Any event change |
| `events:list:staff:{userId}` | 30s | Any event change |
| `events:detail:{eventId}` | 5 min | Event update or participant register |
| `participants:event:{eventId}` | 30s | Any participant change |
| `events:staff:{eventId}` | 5 min | Staff assigned/removed |

Redis unavailable → all `cacheGet`/`cacheSet`/`cacheDel` functions no-op → DB handles all reads. System fully functional without Redis.

---

## 🌐 API Proxy (Vite)

```typescript
// vite.config.ts
proxy: {
  '/api':     { target: 'http://localhost:5000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:5000', changeOrigin: true }
}
```

All frontend API calls use `/api/...` (no hardcoded port). `/uploads` proxy serves event posters from disk.

---

## 🖼 Photo System (Important — Option 2 Architecture)

Agent photos are stored in a separate `agents` table, **not** in `participants`. This means:

1. Admin uploads photo → `POST /participants/:id/photo` → Cloudinary upload → stored in `agents.photo_url` by `agent_code`
2. Any query that returns participants (`getParticipantsByEvent`, `lookup`, `resolve`, `scan`) does `LEFT JOIN agents a ON a.agent_code = p.agent_code`
3. `participants.photo_url` column still exists in DB but is not written to during registration
4. One upload covers the agent across ALL events automatically
5. Bulk upload script: `server/src/scripts/assignPhotosCloudinary.mjs` — reads from `server/uploads/agents/`, uploads to Cloudinary, upserts `agents` table

---

## 📋 Feature Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Participant self-registration | ✅ | Public URL per event, agent_type field |
| Agent code-based check-in/check-out | ✅ | Lookup by code or name |
| Early out with reason | ✅ | Flag on check-out scan |
| Check-in cutoff enforcement | ✅ | Server-side time check |
| Real-time dashboard (30s refresh) | ✅ | EventManagement auto-refresh |
| Admin time correction overrides | ✅ | fix_checkin, force_checkout, early_out |
| Bulk check-out | ✅ | Admin only, method = bulk_admin |
| Event trash bin + restore | ✅ | Soft delete |
| Event archive | ✅ | Status-based |
| Participant trash bin + restore | ✅ | Cancelled participants |
| Participant labels | ✅ | String label + description (not boolean) |
| Agent photo via `agents` table | ✅ | One upload covers all events |
| Excel export (participants + sessions) | ✅ | ExcelJS |
| Dark mode | ✅ | Full support, persisted |
| Collapsible sidebar | ✅ | Persisted |
| Forgot password via OTP email | ✅ | Admin only, Gmail SMTP, 10-min expiry |
| Staff protection (no screenshot) | ✅ | CSS + JS blur overlay |
| Branch + team management | ✅ | Dynamic dropdowns |
| Staff account management | ✅ | Toggle active, reset password |
| Temporary admin grant for staff | ✅ | Expires at event end time |
| Redis caching | ✅ | Optional, graceful degradation |
| EditEventModal dirty-check | ✅ | Discard confirm if unsaved changes |

---

## 🐛 Known Patterns & Gotchas for Debugging

1. **Route order matters in App.tsx:** `/events/trash`, `/events/archive`, `/events/create` MUST be defined before `/events/:eventId` or React Router matches them as event IDs.

2. **Route order matters in events.routes.ts:** Same issue on backend — `GET /events/trash` and `GET /events/archived` are declared before `GET /events/:event_id`.

3. **poster_url in updateEvent:** The `PUT /events/:id` endpoint uses `validate(updateEventSchema)` which passes the body through Zod, but for poster uploads it uses `multipart/form-data` and the controller sets `poster_url` manually from `req.files`. The Zod schema only runs on the JSON fields.

4. **label field type:** In the DB and backend, `label` is `VARCHAR(100)` (a string like `"Awardee"`), NOT a boolean. The old `client/src/types/index.ts` has `label: boolean` which is stale — actual type is `string | null`.

5. **agent_type field:** Added to `participants` table and required in `registerParticipantSchema`. Values: `District Manager | Area Manager | Branch Manager | Unit Manager | Agent`.

6. **photo_url resolution:** Never try to read `participants.photo_url` for display — it may be null. Always expect the JOIN from `agents` table to supply it. The scan service, lookup service, and participants service all JOIN `agents`.

7. **Supabase DB:** `database.ts` has hardcoded Supabase credentials. The `.env` DB vars are commented out. Port is 6543 (Supabase pooler), not 5432.

8. **override API field name:** The `session_id` field in override payloads was previously named `attendance_session_id`. It is now `session_id` in both frontend (`override.api.ts`) and backend (`override.schema.ts`, `override.types.ts`).

9. **Branches cache invalidation:** After any branch/team CRUD, call `invalidateBranchCache()` from `useBranches.ts` on the frontend AND `cacheDel(CK.BRANCHES_ALL)` on the backend. Both must be done or the UI and DB will be out of sync.

10. **Permanent delete guard:** `permanentDeleteEventService` checks `deleted_at IS NOT NULL` before cascading. Events must be soft-deleted first.

---

## 👥 Team

| Name | Role |
|------|------|
| Thomas Joseph Almorin | Lead Developer |
| Kurt Russel Gliponeo | Developer |
| Andrea Laganas | Developer |
| Princes Angelie Subido | Documentation & Testing |

---

*This README was generated to give AI assistants complete context about the PrimeLog codebase. When helping with this project, refer to this document for page names, API endpoints, DB schema, system behavior, and known gotchas. Last updated: March 2026.*
