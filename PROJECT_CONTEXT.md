# VedHub (Campus Connect) - Project Context

## 1. Project Purpose & Vision

**VedHub** (internally "Campus Connect") is a premium, modern social platform designed for university students. It unifies campus life into a single, aesthetically pleasing interface inspired by "Spotify meets GitHub".

**Core Mission:**
To provide a centralized hub for students to:

- **Connect**: Find and join student clubs ("Spaces").
- **Engage**: Discover and register for campus events.
- **Socialize**: Share updates and interact via a social feed.
- **Manage**: Handle university communications via a unified Mail inbox (Gmail integration).
- **Showcase**: Build a developer-centric profile with GitHub stats, skills, and projects.

**Key Aesthetic:**

- **Dark Mode**: Deep, near-black themes (`#0d0d0f`).
- **Modern UI**: Glassmorphism, smooth gradients (purple accents), and micro-animations.
- **Premium Feel**: High-quality typography and polished interactions.

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **Backend / Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Real-time**: Supabase Realtime (WebSockets for chat and notifications)
- **Deployment**: Vercel

## 3. Codebase Structure

### Core Directories

- **`app/`**: Next.js App Router pages and API routes.

  - `(auth)/`: Authentication pages (login).
  - `api/`: Backend API endpoints (events, spaces, mail, etc.).
  - `feed/`: Social feed page.
  - `events/`: Event discovery and details.
  - `spaces/`: Student clubs and chat rooms.
  - `mail/`: Integrated email client.
  - `profile/`: User profiles and editing.
  - `admin/`: Admin dashboard.

- **`components/`**: Reusable UI components.

  - `ui/`: Base UI primitives (buttons, cards, inputs).
  - `events/`, `feed/`, `mail/`, `spaces/`: Feature-specific components.
  - `search/`: Global search functionality.

- **`lib/`**: Utilities and helper functions.

  - `supabase-server.ts`: Server-side Supabase client.
  - `supabase.ts`: Client-side Supabase client.
  - `utils.ts`: General utility functions (cn, formatting).
  - `gmail.ts`: Gmail API integration.

- **`supabase/`**: Database management.

  - `migrations/`: SQL migration files.
  - `*.sql`: Various SQL scripts for RLS policies, functions, and schema fixes.

- **`hooks/`**: Custom React hooks (e.g., `use-realtime`, `use-keyboard-shortcuts`).

### Key Features & Concepts

#### Spaces (Clubs)

- **Concept**: Groups for students to join based on interests.
- **Tech**: Supabase tables `spaces`, `space_members`, `messages`. Real-time chat enabled.

#### Events

- **Concept**: Campus events with registration (solo or team).
- **Tech**: `events`, `event_registrations`, `teams`. Supports approval workflows.

#### Mail

- **Concept**: A unified inbox for university emails.
- **Tech**: Gmail API integration, syncing emails to `mails` table for offline access and better UI.

#### Global Search

- **Concept**: A command-palette style search to find people, spaces, and events.
- **Tech**: `components/search/GlobalSearch.tsx` querying dedicated API routes.

## 4. Development Guidelines

- **API-First**: Use `app/api/` routes for data fetching to ensure consistent logic (e.g., filtering approved events).
- **Type Safety**: Strictly use TypeScript interfaces (imported from `@/types/database` or defined locally).
- **Linting**: Adhere to ESLint rules; avoid `any` types.
- **Middleware**: `proxy.ts` handles session validation and route protection.

## 5. Current State

- **Status**: Active development/refactoring.
- **Recent Work**:
  - Migration fixes.
  - Search module audit and refactor.
  - Mail module overhaul.
  - Deployment preparation (Vercel).
