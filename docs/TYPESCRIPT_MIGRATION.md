# TypeScript Migration Guide

## What Changed

Your project has been converted from JavaScript to TypeScript! 🔵

### Key Changes:

**File Extensions:**
- `.js` → `.ts` (TypeScript files)
- `.jsx` → `.tsx` (React TypeScript files)

**New Files:**
- `tsconfig.json` - TypeScript configuration
- `src/types/index.ts` - Type definitions

**Dependencies Added:**
- `typescript` - TypeScript compiler
- `tsx` - TypeScript executor for Node.js
- `@types/*` - Type definitions for libraries

---

## Setup Instructions (Replace Existing Files)

### Step 1: Backup Current Work (If Any)

If you already made changes:
```bash
# In your project root
git add .
git commit -m "Backup before TypeScript migration"
```

### Step 2: Replace Server Files

**Delete old server/src folder:**
```bash
# In VS Code, delete these:
server/src/
server/server.js
server/package.json
```

**Copy new TypeScript files:**
- Extract the TypeScript version I'm providing
- Copy `server/` folder contents
- Replace all files

### Step 3: Replace Client Files

**Delete old client/src files:**
```bash
# Delete these:
client/src/App.jsx
client/src/main.jsx
client/src/api/axios.js
client/src/pages/
client/package.json
client/vite.config.js
```

**Copy new TypeScript files:**
- Copy `client/` folder contents from TypeScript version
- Replace all files

### Step 4: Reinstall Dependencies

**Backend:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

**Frontend:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

---

## Running with TypeScript

### Backend (Server)

**Development:**
```bash
cd server
npm run dev
```

This uses `tsx watch` which:
- Automatically compiles TypeScript
- Watches for file changes
- Restarts server on changes

**Build for Production:**
```bash
npm run build    # Compiles to JavaScript in dist/
npm start        # Runs compiled version
```

**Run Migrations:**
```bash
npm run db:migrate
```

### Frontend (Client)

**Development:**
```bash
cd client
npm run dev
```

Vite handles TypeScript compilation automatically.

**Build:**
```bash
npm run build   # Type-checks and builds
```

---

## TypeScript Benefits

### 1. **Type Safety**

**Before (JavaScript):**
```javascript
function checkIn(participant) {
  // What properties does participant have? 🤷
  return participant.fullName;
}
```

**After (TypeScript):**
```typescript
function checkIn(participant: Participant): string {
  // TypeScript knows all properties! ✅
  return participant.fullName;  // Auto-complete works!
}
```

### 2. **Catch Errors Early**

**JavaScript:**
```javascript
const user = { name: "Juan" };
console.log(user.fullName);  // undefined (runtime error)
```

**TypeScript:**
```typescript
const user: User = { name: "Juan" };
console.log(user.fullName);  // ❌ Error at compile time!
// Property 'fullName' does not exist on type 'User'
```

### 3. **Better Autocomplete**

VS Code will suggest:
- Available properties
- Function parameters
- Return types
- Import statements

### 4. **Self-Documenting Code**

```typescript
// Types serve as documentation
interface Event {
  id: number;
  title: string;
  eventDate: string;  // Clear what data types are expected
  startTime: string;
  endTime: string;
}
```

---

## Writing TypeScript Code

### Defining Types

**src/types/index.ts:**
```typescript
export interface Participant {
  id: number;
  fullName: string;
  agentCode: string;
  // ... other fields
}
```

### Using Types in Components

**React Component:**
```typescript
import React from 'react';
import { Participant } from '@/types';

interface ParticipantCardProps {
  participant: Participant;
  onCheckIn: (id: number) => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onCheckIn }) => {
  return (
    <div>
      <h3>{participant.fullName}</h3>
      <button onClick={() => onCheckIn(participant.id)}>
        Check In
      </button>
    </div>
  );
};

export default ParticipantCard;
```

### API Calls with Types

```typescript
import api from '@/api/axios';
import { Participant } from '@/types';

// GET request
const getParticipants = async (eventId: number): Promise<Participant[]> => {
  const response = await api.get<Participant[]>(`/participants/event/${eventId}`);
  return response.data;
};

// POST request
const registerParticipant = async (data: RegistrationFormData): Promise<Participant> => {
  const response = await api.post<Participant>('/participants/register', data);
  return response.data;
};
```

### Express Routes with Types

```typescript
import { Router, Request, Response } from 'express';
import { Participant } from '../types/index.js';

const router: Router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { agentCode, fullName, branchName }: Participant = req.body;
  
  // Your logic here
  
  res.json({ success: true });
});
```

---

## Common TypeScript Patterns

### 1. useState with Types

```typescript
import { useState } from 'react';
import { Participant } from '@/types';

const [participants, setParticipants] = useState<Participant[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

### 2. useEffect

```typescript
import { useEffect } from 'react';

useEffect(() => {
  const fetchData = async (): Promise<void> => {
    // Fetch logic
  };
  
  fetchData();
}, []);
```

### 3. Event Handlers

```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
  e.preventDefault();
  // Handle form submission
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const { name, value } = e.target;
  // Handle input change
};

const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
  // Handle button click
};
```

### 4. Optional Properties

```typescript
interface Event {
  id: number;
  title: string;
  description?: string;  // Optional (can be undefined)
  venue?: string;        // Optional
}
```

---

## TypeScript Tips

### 1. **Let TypeScript Infer When Possible**

```typescript
// Good (inferred as string)
const name = "Juan";

// Unnecessary (redundant type annotation)
const name: string = "Juan";
```

### 2. **Use Interfaces for Objects**

```typescript
// Good
interface User {
  id: number;
  name: string;
}

// Also okay, but interfaces are preferred for objects
type User = {
  id: number;
  name: string;
}
```

### 3. **Use Type Assertions Sparingly**

```typescript
// Avoid if possible
const user = data as User;

// Better: validate or use type guards
if (isUser(data)) {
  const user = data;  // TypeScript knows it's User
}
```

---

## VS Code TypeScript Features

### Helpful Commands:

**Go to Definition:** `F12` or `Cmd/Ctrl + Click`
**Find References:** `Shift + F12`
**Rename Symbol:** `F2`
**Show Type:** Hover over variable

### Auto-fix Errors:

- Click on red squiggle
- Press `Ctrl + .` (Quick Fix)
- Select suggested fix

---

## Troubleshooting

### "Cannot find module '@/types'"

**Fix:** Make sure tsconfig.json has path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "Type 'X' is not assignable to type 'Y'"

**Fix:** Check your types match. Use type assertions carefully:
```typescript
const value = data as ExpectedType;
```

### "Implicit 'any' type"

**Fix:** Add type annotations:
```typescript
// Before
function process(data) {  // ❌ implicit any

// After
function process(data: DataType) {  // ✅ explicit type
```

---

## Migration Checklist

- [ ] Replace server files with TypeScript versions
- [ ] Replace client files with TypeScript versions
- [ ] Delete node_modules and reinstall dependencies
- [ ] Run `npm run dev` in both server and client
- [ ] Verify TypeScript compilation works
- [ ] Check VS Code shows no red squiggles
- [ ] Test backend: http://localhost:5000/api/health
- [ ] Test frontend: http://localhost:5173
- [ ] Commit changes to Git

---

## Next Steps

1. ✅ Complete TypeScript migration
2. 📝 Familiarize yourself with types in `src/types/index.ts`
3. 💻 Start implementing features with type safety
4. 🎯 Use VS Code autocomplete features
5. 🐛 Let TypeScript catch bugs before runtime!

---

## Resources

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

---

**Welcome to TypeScript! You'll love the type safety and autocomplete. 🚀**
