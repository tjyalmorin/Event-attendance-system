# PrimeLog: Event Attendance System

Web-based event attendance tracking system for A1 Prime Branch - PRU Life UK

## 🎯 Project Overview

A web-based attendance management system that automates event registration, QR code check-ins/check-outs, and provides real-time analytics for PRU Life UK events.

## 🚀 Features

- **Participant Registration**: Online registration form
- **Check-in/Check-out**: Manual attendance tracking via admin scanner page
- **Event Management**: Create and manage events with real-time stats
- **Participant Management**: CRUD operations, search, filter, export
- **Time-based Check-out Control**: Automated early check-out blocking with Admin override
- **Real-time Dashboard**: Live attendance tracking with 30-second auto-refresh
- **Dark Mode**: Full dark mode support across all pages
- **Persistent Sidebar**: Collapsible sidebar with state persisted via localStorage
- **Undo Delete**: 10-second undo window after deleting an event

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- React Router
- Tailwind CSS
- Axios
- react-datepicker (date/time pickers)

### Backend
- Node.js with TypeScript
- Express.js
- PostgreSQL


### Tools
- Git & GitHub
- Vite (dev server)
- tsx (TypeScript execution)

## 📁 Project Structure

```
QR-event-attendance-system/
├── client/           # React frontend (TypeScript)
│   └── src/
│       ├── contexts/
│       │   ├── DarkModeContext.tsx
│       │   └── SidebarContext.tsx   # sidebar collapse state
│       ├── components/
│       │   └── Sidebar.tsx
│       └── pages/
│           ├── admin/
│           │   ├── AdminLogin.tsx
│           │   ├── EventManagement.tsx
│           │   ├── CreateEvent.tsx
│           │   ├── EventDetail.tsx
│           │   ├── ScannerPage.tsx
│           │   └── Settings.tsx
│           └── client/
│               ├── RegistrationPage.tsx
│               └── ConfirmationPage.tsx
├── server/           # Node.js backend (TypeScript)
├── docs/             # Documentation
└── README.md
```

## 🚀 Quick Start

See `docs/SETUP.md` for detailed setup instructions.

```bash
# Backend
cd server
npm install
npm run db:migrate
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev
```

## ⚙️ Context Providers

Both providers must wrap the app in `App.tsx`:

```tsx
<DarkModeProvider>
  <SidebarProvider>
    <App />
  </SidebarProvider>
</DarkModeProvider>
```

## 🎨 UI Design Notes

- **Primary color**: Crimson `#DC143C`
- **Page background**: `#f0f1f3` (light) / `#0f0f0f` (dark)
- **Cards**: `#ffffff` (light) / `#1c1c1c` (dark)
- **Borders**: `#e5e7eb` (light) / `#2a2a2a` (dark)
- **Header height**: `76px` with `px-12` padding — consistent across all admin pages
- **Font style**: `font-extrabold` titles with crimson period accent (e.g. `Event.Management`)
- **Filter pills**: `rounded-full` with solid crimson active state

## 👥 Team

- Thomas Joseph Almorin - Lead Developer
- Kurt Russel Gliponeo -
- Andrea Laganas -
- Princes Angelie Subido - Documentation & Testing

## 📅 Timeline

- **Start Date**: February 16, 2026
- **Target Deployment**: March 28, 2026
- **Duration**: 6 weeks

## 🏢 Client

PRU Life UK - Specific Branch
Supervisor: Mr. Jayson Frias Vitalicio

## 📝 License

Internal project for PRU Life UK internship