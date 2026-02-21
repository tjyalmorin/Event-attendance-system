# Quick Action Guide - What to Do RIGHT NOW

## Your Current Situation ✅

- ✅ Repository published to GitHub
- ✅ `npm install` already done in server/ and client/
- ❌ Still have JavaScript files (need to convert to TypeScript)
- ❌ No database yet (PostgreSQL)

---

## IMMEDIATE NEXT STEPS (Do This Now)

### Step 1: Download TypeScript Files

1. Download `typescript-files.tar.gz` (from above)
2. Extract it
3. You'll see two folders: `server/` and `client/`

---

### Step 2: Replace Your Current Files

**In your project folder:**

#### **Replace Server Files:**

**Delete these from your current `server/` folder:**
```
server/src/
server/server.js
server/package.json
```

**Copy from extracted TypeScript version:**
```
typescript-conversion/server/package.json → your server/package.json
typescript-conversion/server/tsconfig.json → your server/tsconfig.json
typescript-conversion/server/src/ → your server/src/
```

**Your server/ should now have:**
```
server/
├── src/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── types/
│   └── server.ts  ← Note: .ts extension!
├── .env.example
├── package.json  ← Updated with TypeScript deps
└── tsconfig.json  ← NEW file
```

#### **Replace Client Files:**

**Delete these from your current `client/` folder:**
```
client/src/App.jsx
client/src/main.jsx
client/src/api/axios.js
client/src/pages/
client/package.json
client/vite.config.js
```

**Copy from extracted TypeScript version:**
```
typescript-conversion/client/package.json → your client/package.json
typescript-conversion/client/tsconfig.json → your client/tsconfig.json
typescript-conversion/client/tsconfig.node.json → your client/tsconfig.node.json
typescript-conversion/client/vite.config.ts → your client/vite.config.ts
typescript-conversion/client/src/ → your client/src/
```

**Your client/ should now have:**
```
client/
├── src/
│   ├── api/
│   ├── pages/
│   ├── types/
│   ├── App.tsx  ← .tsx now!
│   └── main.tsx  ← .tsx now!
├── .env.example
├── index.html
├── package.json  ← Updated
├── tsconfig.json  ← NEW
├── tsconfig.node.json  ← NEW
└── vite.config.ts  ← .ts now!
```

---

### Step 3: Reinstall Dependencies (TypeScript Packages)

**Server:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

**Client:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

This installs TypeScript and type definitions.

---

### Step 4: Install PostgreSQL (If Not Yet)

**Windows:**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. Default port: 5432
4. Set password (remember this!)
5. Finish installation

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

---

### Step 5: Create Database

**Open Terminal (not VS Code yet):**

```bash
psql -U postgres
```

Enter your PostgreSQL password.

**Inside PostgreSQL shell:**
```sql
CREATE DATABASE event_attendance;
\q
```

---

### Step 6: Setup .env Files

**Server .env:**

```bash
cd server
cp .env.example .env
```

**Edit `server/.env` in VS Code:**
```env
PORT=5000
NODE_ENV=development

DB_USER=postgres
DB_HOST=localhost
DB_NAME=event_attendance
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_PORT=5432

JWT_SECRET=some_random_secret_string_change_later
CLIENT_URL=http://localhost:5173
```

**Client .env:**
```bash
cd client
cp .env.example .env
```

(Default values are fine, no need to edit)

---

### Step 7: Run Database Migration

**In VS Code Terminal:**

```bash
cd server
npm run db:migrate
```

You should see:
```
Creating database tables...
✅ All tables created successfully!
```

---

### Step 8: Start Development Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

Should see:
```
🚀 Server running on http://localhost:5000
✅ Connected to PostgreSQL database
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 9: Verify Everything Works

**Test Backend:**
- Open: http://localhost:5000/api/health
- Should see JSON response

**Test Frontend:**
- Open: http://localhost:5173
- Should see: "Event Attendance System"

**Check TypeScript:**
- Open any `.ts` or `.tsx` file in VS Code
- Should see no red squiggles
- Hover over variables → see type information

---

### Step 10: Commit TypeScript Migration

**In GitHub Desktop:**

1. You'll see all file changes (JS → TS conversions)
2. Summary: `chore: Migrate to TypeScript`
3. Description:
   ```
   - Convert all JavaScript files to TypeScript
   - Add type definitions
   - Update dependencies
   - Configure tsconfig for both client and server
   ```
4. Click "Commit to main"
5. Click "Push origin"

---

## Checklist

Before continuing to Sprint 1:

- [ ] TypeScript files replaced
- [ ] Dependencies reinstalled
- [ ] PostgreSQL installed
- [ ] Database created
- [ ] .env files configured
- [ ] Migration successful (tables created)
- [ ] Backend running (http://localhost:5000/api/health works)
- [ ] Frontend running (http://localhost:5173 works)
- [ ] No TypeScript errors in VS Code
- [ ] Changes committed to GitHub

---

## If You Get Stuck

### "npm run dev fails in server"

**Check:**
- Is PostgreSQL running?
- Is password in .env correct?
- Run `npm install` again

### "TypeScript errors in VS Code"

**Fix:**
- Restart VS Code
- Close and reopen the folder
- Run `npm install` again

### "Can't connect to database"

**Check:**
- PostgreSQL service running?
  - Windows: Services → postgresql
  - Mac: `brew services list`
- Database exists? Run `psql -U postgres -l`

---

## What's Next?

**After successful setup:**

1. 🎨 **Sprint 0 continues:**
   - Create wireframes in Figma
   - Plan Sprint 1 tasks
   - Divide work among team

2. 💻 **Start coding (Sprint 1):**
   - Registration form
   - QR code generation
   - Event management

3. 🔄 **Daily workflow:**
   - Pull latest from GitHub (morning)
   - Code locally
   - Commit changes (evening)
   - Push to GitHub (at home)

---

## Quick Reference

**Start servers:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

**Stop servers:**
`Ctrl + C` in each terminal

**Restart after code changes:**
- Backend: Automatically restarts (tsx watch)
- Frontend: Automatically reloads (Vite HMR)

---

**You're ready to code in TypeScript! 🎉**

Follow TYPESCRIPT_MIGRATION.md for detailed TypeScript usage guide.
