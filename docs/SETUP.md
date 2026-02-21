# Setup Guide - QR Event Attendance System

## Prerequisites

- **Node.js** (v18 or higher) - https://nodejs.org/
- **PostgreSQL** (v14 or higher) - https://postgresql.org/download/
- **Git** - https://git-scm.com/
- **VS Code** (recommended) - https://code.visualstudio.com/

---

## Step-by-Step Setup

### 1. Clone or Extract Project

If from GitHub:
```bash
git clone <your-repo-url>
cd QR-event-attendance-system
```

If from zip/tar.gz:
- Extract to your workspace folder
- Open folder in VS Code

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend (new terminal):**
```bash
cd client
npm install
```

### 3. Install & Setup PostgreSQL

**Windows:**
1. Download from https://postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set!
4. Default port: 5432

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 4. Create Database

Open terminal:
```bash
psql -U postgres
```

Enter password, then:
```sql
CREATE DATABASE event_attendance;
\q
```

### 5. Configure Environment Variables

**Server .env:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_NAME=event_attendance
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_PORT=5432

JWT_SECRET=change_this_to_random_string
CLIENT_URL=http://localhost:5173
```

**Client .env:**
```bash
cd client
cp .env.example .env
```

(Default values are fine)

### 6. Run Database Migration

```bash
cd server
npm run db:migrate
```

Should see: "✅ All tables created successfully!"

### 7. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 8. Verify Setup

- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:5173

---

## Troubleshooting

**"Cannot connect to database"**
- Check PostgreSQL is running
- Verify password in .env
- Check database exists: `psql -U postgres -l`

**"Port already in use"**
- Change PORT in server/.env
- Or kill process: `lsof -ti:5000 | xargs kill`

**TypeScript errors**
- Restart VS Code
- Run `npm install` again
- Check tsconfig.json exists

---

## Project Structure

```
QR-event-attendance-system/
├── client/              # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── api/        # API calls
│   │   ├── pages/      # Page components
│   │   ├── types/      # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/              # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/     # Configuration
│   │   ├── database/   # Migrations
│   │   ├── routes/     # API routes
│   │   ├── types/      # TypeScript types
│   │   └── server.ts
│   └── package.json
│
└── docs/               # Documentation
```

---

## Next Steps

1. ✅ Setup complete
2. 📚 Read TYPESCRIPT_MIGRATION.md for TypeScript guide
3. 🎨 Start Sprint 0 (planning, wireframes)
4. 💻 Begin Sprint 1 development

---

## Common Commands

**Development:**
```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev
```

**Database:**
```bash
npm run db:migrate    # Create tables
```

**Build:**
```bash
npm run build         # TypeScript → JavaScript
```

---

For detailed TypeScript usage, see `TYPESCRIPT_MIGRATION.md`
