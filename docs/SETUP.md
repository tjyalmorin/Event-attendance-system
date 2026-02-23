# Setup Guide — PrimeLog (Local Dev)

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org/
- **PostgreSQL** v14 or higher — https://postgresql.org/download/
- **pgAdmin 4** — https://pgadmin.org/download/ (comes with PostgreSQL installer)
- **Git** — https://git-scm.com/
- **VS Code** (recommended) — https://code.visualstudio.com/

---

## Step 1 — Clone the repo

```bash
git clone <your-repo-url>
cd QR-event-attendance-system
```

---

## Step 2 — Install dependencies

Open two terminals:

```bash
# Terminal 1 — Backend
cd server
npm install

# Terminal 2 — Frontend
cd client
npm install
```

---

## Step 3 — Create the local database in pgAdmin

1. Open **pgAdmin 4**
2. Connect to your local PostgreSQL server
3. Right-click **Databases** → **Create** → **Database**
4. Name it: `primelog_local` → click **Save**

---

## Step 4 — Configure environment variables

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in your PostgreSQL password:

```env
PORT=5000
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_NAME=primelog_local
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_PORT=5432

JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## Step 5 — Run the database migration

This creates all the tables, indexes, and triggers automatically:

```bash
cd server
npm run db:migrate
```

Expected output:
```
🚀 Running database migration...
✅ Connected to PostgreSQL database
✅ Migration complete! All tables and indexes created.
```

### Verify in pgAdmin (optional)
- Expand `primelog_local` → **Schemas** → **public** → **Tables**
- Right-click **Tables** → **Refresh**
- You should see 6 tables:
  - `attendance_sessions`
  - `event_permissions`
  - `events`
  - `participants`
  - `scan_logs`
  - `users`

---

## Step 6 — Start the dev servers

```bash
# Terminal 1 — Backend (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (runs on http://localhost:5173)
cd client
npm run dev
```

### Health check
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:5173

---

## Common Commands

```bash
# Run migration (create/update tables)
cd server && npm run db:migrate

# Start backend dev server
cd server && npm run dev

# Start frontend dev server
cd client && npm run dev
```

---

## Troubleshooting

**"Cannot connect to database"**
- Make sure PostgreSQL is running (check pgAdmin — server should show a green icon)
- Double-check `DB_PASSWORD` in your `.env`
- Make sure the database `primelog_local` exists in pgAdmin

**"Port already in use"**
- Change `PORT` in `server/.env`
- Or kill the process:
  ```bash
  # Mac/Linux
  lsof -ti:5000 | xargs kill
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

**TypeScript errors**
- Restart VS Code
- Run `npm install` again in the affected folder

---

## Project Structure

```
QR-event-attendance-system/
├── client/              # Frontend — React + TypeScript + Vite
│   └── src/
│       ├── api/         # Axios API calls
│       ├── pages/       # Page components
│       └── types/       # TypeScript types
│
├── server/              # Backend — Node.js + Express + TypeScript
│   └── src/
│       ├── config/      # DB connection (database.ts)
│       ├── database/    # Migration script (migrate.ts)
│       ├── routes/      # API route handlers
│       └── types/       # TypeScript types
│
└── docs/                # Documentation
```
