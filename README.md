# Minimalist College Community App

A full-stack web application for a college community with a strict black-and-white minimalist design.

## Project Structure

```
.
├── app
│   ├── actions            # Server Actions
│   ├── admin              # Admin Dashboard
│   │   └── events         # Event Management
│   ├── alerts             # Alerts/Inbox Page
│   ├── api                # API Routes
│   │   ├── admin          # Admin APIs
│   │   ├── alerts         # Alerts API
│   │   ├── auth           # Auth API
│   │   ├── debug          # Debug API
│   │   ├── events         # Events API
│   │   ├── feed           # Feed API
│   │   ├── invites        # Invites API
│   │   ├── notifications  # Notifications API
│   │   ├── spaces         # Spaces API
│   │   └── users          # User Search API
│   ├── auth               # Auth Pages
│   ├── events             # Events Hub & Details
│   ├── feed               # Social Feed
│   ├── login              # Login Page
│   ├── profile            # User Profiles
│   │   ├── [id]           # Public Profile
│   │   └── edit           # Profile Editor
│   ├── spaces             # Spaces/Clubs
│   ├── globals.css        # Global Styles
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Home Dashboard
├── components
│   ├── email              # Email Rendering Components
│   ├── events             # Event Components (Cards, Modals, Forms)
│   ├── feed               # Feed Components (Posts, Comments)
│   ├── profile            # Profile Components (Dashboard, Editor)
│   ├── spaces             # Space Components
│   ├── ui                 # Reusable UI Components (Shadcn/Custom)
│   ├── AuthProvider.tsx   # Auth Context
│   ├── BottomNav.tsx      # Mobile Navigation
│   ├── ClientLayout.tsx   # Client Layout Wrapper
│   └── Sidebar.tsx        # Desktop Sidebar
├── hooks
│   └── use-debounce.ts    # Custom Hooks
├── lib
│   ├── email              # Email Parsing & Sanitization
│   ├── feed               # Feed Logic
│   ├── profile            # Profile Logic (Integrations, Leveling)
│   ├── supabase           # Supabase Clients (Client/Server)
│   ├── auth.ts            # Auth Logic
│   ├── gmail.ts           # Gmail Client
│   └── utils.ts           # Utilities
├── public                 # Static Assets
├── supabase
│   ├── migrations         # Database Migrations
│   └── schema.sql         # Core Schema
├── types                  # TypeScript Definitions
├── middleware.ts          # Middleware (Auth/Routing)
├── next.config.ts         # Next.js Config
├── package.json           # Dependencies
└── tailwind.config.ts     # Tailwind Config
```

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Home**: Admin-controlled dashboard with announcements and featured events.
- **Feed**: Campus-wide microblogging feed.
- **Spaces**: Groups for clubs and global discussions.
- **Events**: Event management and registration system.
- **Alerts**: Read-only integration with college email (simulated).
