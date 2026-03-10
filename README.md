# PrimeLog — Full System Context README
> **For AI Assistants:** This document gives you complete context on the PrimeLog system — a QR-based event attendance tracking system for PRU Life UK (A1 Prime Branch). Read every section to understand the full codebase, all pages, and all backend functionality before responding.

---

## 🧭 Project Overview

**PrimeLog** is a web-based event attendance management system built for PRU Life UK's internal events. It automates event registration, QR code check-ins/check-outs, and provides real-time analytics.

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
| Database | PostgreSQL (via `pg` pool) |
| Caching | Redis (ioredis) — optional, degrades gracefully |
| Auth | JWT (8h expiry) |
| File Storage | Cloudinary (photos), local disk (posters) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod (server-side) |

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
│       │   ├── axios.ts           # Axios instance with auth interceptor + 401 redirect
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
│       │   ├── database.ts        # PostgreSQL pool (max 10, idle timeout 30s, Manila timezone)
│       │   ├── redis.ts           # Redis client with graceful fallback
│       │   └── cloudinary.ts      # Cloudinary v2 config
│       ├── database/
│       │   ├── migrate.ts         # Full DB migration (idempotent — safe to re-run)
│       │   ├── seed.ts            # Basic seed (admin + staff + sample event)
│       │   ├── seed.demo.ts       # 200+ participants across all branches with labels
│       │   ├── seed.mini.ts       # 5-participant minimal seed for dev
│       │   ├── seed.prime.ts      # Real A1 Prime March 2026 Branch Meeting data (56 participants)
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
│       │   └── upload.ts          # multer: memory storage for photos, disk for posters
│       ├── routes/
│       │   ├── auth/              # login, getMe, OTP forgot password
│       │   ├── events/            # Full event CRUD, trash, archive, staff management
│       │   ├── participants/      # Register, list, cancel, label, trash
│       │   ├── scan/              # Lookup, resolve, scan, sessions, logs, bulk checkout
│       │   ├── users/             # User CRUD, profile, password, admin grants
│       │   ├── branches/          # Branch + team CRUD
│       │   └── override/          # Admin time correction overrides + logs
│       ├── schemas/               # Zod validation schemas for every route
│       ├── types/                 # TypeScript types (user, event, participant, override)
│       ├── utils/cache.ts         # Redis helpers: cacheGet, cacheSet, cacheDel, TTL constants
│       └── server.ts              # Express app setup (helmet, CORS, static, routes, error handler)
└── docs/                          # Setup guides, commit conventions, TypeScript migration guide
```

---

## 🖥 Frontend Pages — Full List & Descriptions

### Public (Client) Pages — No Auth Required

#### `/register/:eventId` → `RegistrationPage.tsx`
- Public participant self-registration form
- Fields: Agent Code, Full Name, Branch Name (dropdown), Team Name (dropdown)
- Branch/team dropdowns dynamically loaded from `/api/branches`
- Validates agent code, checks event is open and within registration window
- On success → redirects to `/confirmation`
- Shows event title, date, venue, and poster if available

#### `/confirmation` → `ConfirmationPage.tsx`
- Shown after successful registration
- Displays registration confirmation with participant details
- Shows QR code / confirmation number for check-in reference

---

### Admin Auth Pages — No Auth Required

#### `/admin/login` → `AdminLogin.tsx`
- Admin login form (email + password)
- On success: saves JWT to `localStorage` as `authToken`, saves user object as `user`
- Redirects to `/admin/events`
- Links to forgot password flow

#### `/admin/forgot-password` → `ForgotPasswordPage.tsx`
- Step 1 of password reset: enter admin email
- Sends OTP to email via Gmail SMTP
- Only works for users with `role = 'admin'` and `deleted_at IS NULL`

#### `/admin/verify-otp` → `VerifyOtpPage.tsx`
- Step 2: enter 6-digit OTP received via email
- OTP valid for 10 minutes
- Marks `otp_verified = TRUE` in DB on success

#### `/admin/reset-password` → `ResetPasswordPage.tsx`
- Step 3: set new password
- Password must be 8+ chars, contain uppercase + number
- Clears OTP fields in DB after reset

---

### Protected Admin Pages — JWT Required

All admin pages include the collapsible `Sidebar.tsx` on the left.

#### `/admin/events` → `EventManagement.tsx`
- Main dashboard — lists all events (admin sees all; staff sees only assigned)
- Cards show: event title, date, venue, status badge, registered count
- Filter pills: All / Draft / Open / Closed / Completed
- Search bar filters by title
- Actions per card: View Details, Edit (opens `EditEventModal`), Delete (soft delete with 10-second undo toast)
- Top-right buttons: Trash Bin, Archive, Create Event
- Status badge colors: Draft=gray, Open=green, Closed=orange, Completed=blue, Archived=purple
- Auto-refreshes every 30 seconds
- Dark mode fully supported

#### `/admin/events/create` → `CreateEvent.tsx`
- Multi-step or single-page form to create a new event
- Fields: Title, Description (optional toggle), Event Date, Start Time, End Time, Venue, Check-in Cutoff
- Branch/team selector: picks which branches + teams can register
- Staff assignment: selects staff users to assign to event (can filter by branch)
- Poster upload: optional image upload (JPG/PNG/WEBP, max 5MB)
- Registration window: optional open/close datetime for self-registration
- On submit → creates event with status `draft`

#### `/admin/events/:eventId` → `EventDetail.tsx`
- Full detail view of a single event
- Header: event title, date, time, venue, status badge, registered count
- Tabs (via `EventDetailTabs.tsx`): Participants | Sessions | Scan Logs | Override Logs
- **Participants tab:**
  - Full table: Agent Code, Full Name, Branch, Team, Status, Registration Date, Label
  - Search/filter by branch, team, label, status
  - Actions: Cancel (soft delete), Set Label (opens label modal), View photo
  - Export to Excel button
  - Bulk actions: select multiple → cancel / export
- **Sessions tab:**
  - Attendance sessions table: participant name, check-in time, check-out time, method
  - Edit button per row (admin only) → opens time edit modal
  - Bulk check-out: select all checked-in → bulk checkout
  - Download sessions as Excel
- **Scan Logs tab:**
  - All scan events: check_in, check_out, denied
  - Shows denial reason, timestamp, agent code, name
- **Override Logs tab:**
  - All admin time corrections with original time, adjusted time, reason, admin name
- Event actions (top): Edit Event, Open/Close Registration, Archive Event, Manage Staff

#### `/admin/events/:eventId/scanner` → `ScannerPage.tsx`
- Main check-in/check-out scanner interface for events
- Search box (agent code or name) with live lookup
- Lookup returns participant card: photo, name, branch, team, label badge
- If multiple matches → disambiguation list shown
- Confirm identity → action button shows "CHECK IN" or "CHECK OUT"
- Early Out toggle: if checking out, admin/staff can mark as early departure + reason
- Result feedback: full-screen green (check-in) or blue (check-out) confirmation card
- Denial logging: if identity is wrong, staff presses "Deny" → logs denial
- Check-in cutoff enforced: past cutoff time shows error
- Uses `useStaffProtection` hook for staff role (disables screenshots, right-click, copy)

#### `/admin/events/trash` → `TrashBin.tsx`
- Lists soft-deleted events (`deleted_at IS NOT NULL`)
- Actions: Restore (returns to active events) | Permanent Delete
- Also has tab for cancelled participants (soft-deleted participants per event)
- Participant restore: restores cancelled participants back to `confirmed`

#### `/admin/events/archive` → `EventArchive.tsx`
- Lists events with `status = 'archived'`
- View-only with restore option (returns to `closed` status)

#### `/admin/settings/profile` → `ProfileSettingsPage.tsx`
- Edit own profile: Full Name, Branch Name, Team Name
- Change password section: Current Password → New Password (8+ chars, uppercase + number)
- Shows current logged-in user info (from `localStorage.user`)

#### `/admin/settings/accounts` → `AccountManagement.tsx`
- Admin-only: full user management table
- Columns: Agent Code, Full Name, Email, Branch, Role, Status (Active/Inactive)
- Actions: Edit, Toggle Active/Inactive, Delete (soft), Reset Password
- Create New User button: opens modal form with all fields
- Filter by role (admin/staff), search by name/email/agent code

#### `/admin/settings/branches` → `BranchManagement.tsx`
- Admin-only: manage branches and their teams
- Branch list with expand to see teams
- Add/Edit/Delete branches
- Add/Edit/Delete teams within each branch
- Changes invalidate the branch cache (used by registration form dropdowns)

---

### `EventDetailTabs.tsx`
- Shared tab navigation component used inside `EventDetail.tsx`
- Tabs: Participants, Sessions, Scan Logs, Override Logs
- Renders the correct content section based on active tab

---

## 🔧 Backend API — Complete Endpoint Reference

Base URL: `http://localhost:5000/api`  
Auth: `Authorization: Bearer <JWT>` for protected routes

---

### Auth Routes `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login with email + password. Returns `{ token, user }`. Rate limited (15/15min prod). |
| GET | `/auth/me` | JWT | Returns current logged-in user object. |
| POST | `/auth/forgot-password` | None | Send OTP to admin email. Always returns success (security). |
| POST | `/auth/verify-otp` | None | Verify 6-digit OTP (10-min expiry). |
| POST | `/auth/reset-password` | None | Reset password after OTP verified. |

---

### Events Routes `/api/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | JWT | Get all events. Admin sees all; staff sees only assigned events. |
| POST | `/events` | Admin | Create event. Supports `multipart/form-data` (poster upload). Saves `event_branches` and assigns staff. |
| GET | `/events/trash` | Admin | Get soft-deleted events. |
| GET | `/events/archived` | Admin | Get archived events (`status = 'archived'`). |
| GET | `/events/:event_id` | JWT | Get single event with `registered_count` and `event_branches`. |
| PUT | `/events/:event_id` | Admin | Update event fields + optionally update branches and staff. |
| DELETE | `/events/:event_id` | Admin | Soft delete event (`deleted_at = NOW()`). |
| POST | `/events/:event_id/restore` | Admin | Restore soft-deleted event. |
| POST | `/events/:event_id/restore-archive` | Admin | Restore archived event to `closed` status. |
| DELETE | `/events/:event_id/permanent` | Admin | Cascade delete all related data + permanently delete event. |
| POST | `/events/:event_id/permissions` | Admin | Assign a staff user to event. |
| GET | `/events/:event_id/admin-grants` | Admin | Get all admin grants for event. |
| GET | `/events/:event_id/staff` | Admin | Get all staff assigned to event. |
| DELETE | `/events/:event_id/staff/:user_id` | Admin | Remove staff from event. |
| GET | `/events/:event_id/participants/cancelled` | Admin | Get cancelled (trashed) participants for event. |

---

### Participants Routes `/api/participants`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/participants/register/:event_id` | None | Public self-registration. Validates: event open, registration window, no duplicate agent code. Inherits `photo_url` from previous registrations. |
| GET | `/participants/event/:event_id` | JWT | Get participants. Admin sees all; staff sees only their branch. |
| DELETE | `/participants/:participant_id` | Admin | Soft cancel participant (`registration_status = 'cancelled'`, `deleted_at = NOW()`). |
| POST | `/participants/:participant_id/photo` | Admin | Upload participant photo to Cloudinary (updates all matching agent_code records). |
| PATCH | `/participants/:participant_id/label` | Admin, Staff | Set label (e.g., "Awardee", "VIP") + optional description. |
| PATCH | `/participants/:participant_id/restore` | Admin | Restore cancelled participant back to `confirmed`. |
| DELETE | `/participants/:participant_id/permanent` | Admin | Permanently delete cancelled participant + scan logs + attendance sessions. |

---

### Attendance / Scan Routes `/api/attendance`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/attendance/lookup` | JWT | Search participant by agent code or name (partial match). Returns single result or disambiguation list. Enforces check-in cutoff. |
| POST | `/attendance/resolve` | JWT | Resolve a specific participant after disambiguation. Returns `next_action` (check_in / check_out / blocked). |
| POST | `/attendance/scan` | JWT | Perform check-in or check-out. Creates/updates `attendance_sessions`. Supports `is_early_out` flag. |
| POST | `/attendance/deny` | JWT | Log a denial (identity mismatch). |
| GET | `/attendance/sessions/:event_id` | JWT | Get all attendance sessions for event with participant details. |
| GET | `/attendance/logs/:event_id` | JWT | Get all scan logs for event. |
| PATCH | `/attendance/sessions/:session_id/times` | Admin | Update check-in and/or check-out time for a session. |
| POST | `/attendance/sessions/:event_id/bulk-checkout` | Admin | Bulk check-out multiple sessions by ID array. Only affects checked-in (no check-out) sessions. |

---

### Users Routes `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | Get all users (not soft-deleted). |
| POST | `/users` | Admin | Create user. Validates unique email + agent code. Hashes password with bcrypt (10 rounds). |
| PUT | `/users/:user_id` | Admin | Update user fields (partial). |
| PATCH | `/users/:user_id/active` | Admin | Toggle `is_active` boolean. Deactivated users cannot log in. |
| DELETE | `/users/:user_id` | Admin | Soft delete user. |
| PUT | `/users/:user_id/reset-password` | Admin | Admin force-reset user password. |
| PUT | `/users/profile` | JWT | Update own profile (full_name, branch_name, team_name). |
| PUT | `/users/change-password` | JWT | Change own password (requires currentPassword). |
| GET | `/users/staff-by-branches` | JWT | Get staff filtered by branch names (query: `?branches=A1 Prime,Alexandrite 1`). |
| POST | `/users/admin-grant` | Admin | Grant temporary admin access to staff for an event (expires at event end time). |
| GET | `/users/admin-grants/me` | JWT | Get own active admin grants. |
| DELETE | `/users/admin-grant/:grant_id` | Admin | Revoke admin grant. |

---

### Branches Routes `/api/branches`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/branches` | JWT | Get all branches with their teams. Cached in Redis (1hr TTL). |
| POST | `/branches` | Admin | Create branch. Invalidates cache. |
| PUT | `/branches/:branch_id` | Admin | Update branch name. Invalidates cache. |
| DELETE | `/branches/:branch_id` | Admin | Delete branch + cascades to teams. |
| GET | `/branches/:branch_id/teams` | JWT | Get teams for a branch. |
| POST | `/branches/:branch_id/teams` | Admin | Create team in branch. |
| PUT | `/branches/teams/:team_id` | Admin | Update team name. |
| DELETE | `/branches/teams/:team_id` | Admin | Delete team. |

---

### Override Routes `/api/override`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/override/fix-checkin` | Admin | Fix wrong check-in time OR create manual check-in (session_id = 0). Logs to `override_logs`. |
| POST | `/override/force-checkout` | Admin | Force a check-out time on a session that has no check-out. |
| POST | `/override/early-out` | Admin | Mark a check-out as early departure with cutoff time. |
| GET | `/override/logs/:event_id` | Admin | Get all override logs for event with participant + admin names. |

---

## 🗄 Database Schema — All Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK | gen_random_uuid() |
| agent_code | VARCHAR(50) UNIQUE | |
| full_name | VARCHAR(255) | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| branch_name | VARCHAR(255) | |
| team_name | VARCHAR(255) | |
| role | VARCHAR(50) | `admin` or `staff` |
| is_active | BOOLEAN | default TRUE — deactivated users blocked from login |
| otp_code / otp_expires / otp_verified | | For forgot password flow |
| created_at / updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | soft delete |

### `events`
| Column | Notes |
|--------|-------|
| event_id | SERIAL PK |
| created_by | UUID → users |
| title, description, venue | |
| event_date | DATE |
| start_time, end_time, checkin_cutoff | TIME |
| registration_start, registration_end | TIMESTAMPTZ |
| status | `draft` / `open` / `closed` / `completed` / `archived` |
| poster_url | VARCHAR(500) |
| registration_link | VARCHAR(500) UNIQUE — used for public reg URL |
| version | INT — incremented on every PUT |
| deleted_at | TIMESTAMPTZ — soft delete |

### `event_branches`
Links events to specific branches + teams for registration form filtering.
| Column | Notes |
|--------|-------|
| event_id | → events |
| branch_name | |
| team_names | TEXT[] — array of team names |

### `event_permissions`
Links staff users to events they can access.
| Column | Notes |
|--------|-------|
| user_id | → users |
| event_id | → events |

### `admin_grants`
Temporary admin elevation for staff users.
| Column | Notes |
|--------|-------|
| granted_to_user_id / granted_by_user_id | → users |
| event_id | → events |
| is_edit_allowed | BOOLEAN |
| expires_at | Set to event end time |
| revoked_at | Set when manually revoked |

### `participants`
| Column | Notes |
|--------|-------|
| participant_id | SERIAL PK |
| event_id | → events |
| agent_code | VARCHAR(50) |
| full_name, branch_name, team_name | |
| registration_status | `confirmed` or `cancelled` |
| registered_at | TIMESTAMPTZ |
| photo_url | Cloudinary URL or local path |
| label | VARCHAR(100) e.g., "Awardee", "VIP" |
| label_description | TEXT |
| deleted_at | Soft delete (used for cancelled) |

### `attendance_sessions`
One row per check-in event per participant per event.
| Column | Notes |
|--------|-------|
| session_id | SERIAL PK |
| participant_id / event_id | |
| check_in_time / check_out_time | TIMESTAMPTZ |
| check_in_method / check_out_method | `manual`, `early_out`, `bulk_admin`, `admin_override` |
| early_out_reason | TEXT |
| early_out_recorded_by | UUID → users |

### `override_logs`
Audit trail for all admin time corrections.
| Column | Notes |
|--------|-------|
| override_id | SERIAL PK |
| attendance_session_id | → attendance_sessions (nullable for manual check-in) |
| override_type | `fix_checkin`, `force_checkout`, `early_out` |
| reason | TEXT — required |
| original_time / adjusted_time / early_out_cutoff | TIMESTAMPTZ |

### `scan_logs`
Raw log of every scan attempt (check_in, check_out, denied).
| Column | Notes |
|--------|-------|
| scan_id | SERIAL PK |
| participant_id | nullable (logged even if participant not found) |
| scan_type | `check_in`, `check_out`, `denied` |
| denial_reason | TEXT |
| qr_token | agent_code used in scan |

### `branches` + `teams`
Branch management tables — used by registration dropdowns and staff filtering.

---

## 🔐 Auth & Role System

| Role | Access |
|------|--------|
| `admin` | Full access to all routes and all events |
| `staff` | Can only see events they are assigned to via `event_permissions`. Cannot create events, manage users, or access settings. |
| `admin_grant` | Staff with a row in `admin_grants` can scan and view like admin — only for their specific event and only until event end time. |

**JWT Payload:** `{ user_id, role, branch_name }`  
**Token expiry:** 8 hours  
**Storage:** `localStorage.authToken` (frontend)  
**Deactivated users:** `is_active = FALSE` — blocked at login service

---

## ⚙️ Key Frontend Mechanics

### Sidebar (`Sidebar.tsx`)
- Collapsible (persists via `SidebarContext` → `localStorage`)
- Shows: Event Management, Account Management (admin only), Branch Management (admin only)
- Bottom: Dark Mode toggle, Profile Settings, Logout
- Active route highlighted with crimson background

### DarkModeContext
- Adds/removes `dark` class on `<html>` element
- All components use Tailwind `dark:` variants

### Axios Interceptor (`axios.ts`)
- Auto-attaches `Authorization: Bearer <token>` to every request
- On 401 response → clears localStorage + redirects to `/admin/login`

### useBranches Hook
- Module-level cache (persists across re-renders but clears on page refresh)
- Returns `{ branches, branchNames, getTeamsForBranch, loading }`
- Call `invalidateBranchCache()` after any branch CRUD operation

### useStaffProtection Hook
- Active only for users with `role = 'staff'`
- Disables: right-click, Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, Ctrl+Shift+S, PrintScreen, drag
- Shows black overlay when window loses focus (blur/visibilitychange)

### PrivateRoute
- Checks for `localStorage.authToken`
- Redirects to `/admin/login` if not present

---

## 🚀 Running the System

```bash
# Backend (port 5000)
cd server
cp .env.example .env   # fill in DB_PASSWORD, JWT_SECRET
npm install
npm run db:migrate     # creates all tables, indexes, seeds SuperAdmin + branches
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
DB_USER=postgres
DB_HOST=localhost
DB_NAME=primelog_local
DB_PASSWORD=your_password
DB_PORT=5432
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
npm run db:seed:prime     # Real A1 Prime March 2026 data (56 participants, 4 teams)
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

Redis unavailable → all cache functions return null/no-op → DB handles all reads. System fully functional without Redis.

---

## 🌐 API Proxy (Vite)

```typescript
// vite.config.ts
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:5000', changeOrigin: true }
}
```

All frontend API calls use `/api/...` (no hardcoded port). The Vite dev server proxies to Express.

---

## 📋 Feature Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Participant self-registration | ✅ | Public URL per event |
| QR / Manual check-in + check-out | ✅ | Agent code scan |
| Early out with reason | ✅ | Flag on check-out |
| Check-in cutoff enforcement | ✅ | Time-based, server-side |
| Real-time dashboard (30s refresh) | ✅ | |
| Admin time correction overrides | ✅ | Full audit log |
| Bulk check-out | ✅ | Admin only |
| Event trash bin + restore | ✅ | Soft delete |
| Event archive | ✅ | Status-based |
| Participant trash bin + restore | ✅ | |
| Participant labels (Awardee, VIP…) | ✅ | Custom text + description |
| Photo upload via Cloudinary | ✅ | Auto-applied to all registrations by agent code |
| Excel export (participants + sessions) | ✅ | ExcelJS |
| Dark mode | ✅ | Full support, persisted |
| Collapsible sidebar | ✅ | Persisted |
| Forgot password via OTP email | ✅ | Admin only, Gmail SMTP |
| Staff protection (no screenshot) | ✅ | CSS + JS, blur overlay |
| Branch + team management | ✅ | Dynamic dropdowns |
| Staff account management | ✅ | Toggle active, reset password |
| Temporary admin grant for staff | ✅ | Expires at event end time |
| Redis caching | ✅ | Optional, graceful degradation |

---

## 👥 Team

| Name | Role |
|------|------|
| Thomas Joseph Almorin | Lead Developer |
| Kurt Russel Gliponeo | Developer |
| Andrea Laganas | Developer |
| Princes Angelie Subido | Documentation & Testing |

---

*This README was generated to give AI assistants complete context about the PrimeLog codebase. When helping with this project, refer to this document for page names, API endpoints, DB schema, and system behavior.*
