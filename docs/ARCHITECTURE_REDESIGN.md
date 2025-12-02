# Campus Connect Architecture Redesign (2025)

## Objectives

- Deliver a modular platform that can scale features (spaces, feed, events, alerts) without rewrites.
- Enforce end-to-end security with RLS-first data access and scoped Supabase clients.
- Reduce coupling between UI, business logic, and persistence to unblock independent releases.
- Provide clear documentation that mirrors the actual code layout under `app/`, `components/`, `lib/`, `supabase/`, and `types/`.

## System Overview

```
Client (Next.js App Router)
│  - Server Components (data fetching + streaming UI)
│  - Client Components (interactive dashboards, editors)
│
├─▶ Edge Runtime / Middleware
│  - Authentication guard
│  - Request tracing + feature flags
│
├─▶ Application Layer (Next.js server actions + route handlers)
│  - Validates input via zod schemas in `lib/validators`
│  - Calls domain services via `lib/services/*`
│
├─▶ Domain Services (co-located in `lib/<domain>`)
│  - Compose repositories + background jobs
│  - Emit analytics + notifications
│
└─▶ Data Access + Infra
   - Supabase (Postgres + Storage + Realtime)
   - Supabase Functions (cron + webhooks)
   - External APIs (Gmail, GitHub, LeetCode, Codeforces)
```

### Layer Responsibilities

- **Client Shell** (`app/`, `components/`): declares UI composition. All data mutations route through server actions or typed API handlers; no direct Supabase client usage in the browser.
- **Edge Layer** (`middleware.ts`, `lib/auth-session.ts`): normalizes auth state, injects correlation IDs, and blocks non-admin traffic from `/app/admin/*` using `am_i_admin()` RPC.
- **Application Layer** (`app/api/**`, server actions within `app/**`): owns request/response contracts, caching hints, and orchestration. These modules are thin; they translate HTTP ↔ domain calls.
- **Domain Modules** (`lib/events`, `lib/feed`, `lib/spaces`, `lib/alerts`, `lib/profile`): encapsulate business rules and invariants. Each module exposes:
  - `service.ts` for command/query use cases.
  - `repository.ts` for data access (Supabase queries with typed response mapping to `types/*.ts`).
  - `validators.ts` (zod) to guard inputs.
  - `events.ts` (optional) to publish internal messages.
- **Data Layer** (`supabase/*.sql`, `lib/supabase-server.ts`): single source of truth for schemas, migrations, policies, and RPC helpers. Browser clients use `lib/supabase.ts` only for anonymous/public reads guarded by RLS.

## Domain Blueprints

### 1. Spaces & Messaging
- Tables: `spaces`, `space_members`, `space_channels`, `space_messages`, `space_message_reactions`.
- Services:
  - `spacesService.createSpace` enforces slug uniqueness, seeds default channel, and assigns `owner` membership.
  - `membershipService.inviteMembers` triggers email invites through `lib/email/spaces`.
  - `chatService.postMessage` writes into `space_messages` and broadcasts via Supabase Realtime on the `space_messages` channel.
- Policies: only members can read/write inside private spaces; public spaces expose metadata but hide messages until joined.

### 2. Events & Registrations
- Tables: `events`, `event_slots`, `event_registrations`, `teams`, `team_members`, `event_forms`, `event_form_responses`.
- Services:
  - `eventsService.schedule` ensures no overlapping times for the same venue, persists Markdown agenda, and queues reminder emails.
  - `registrationService.register` wraps in a transaction: check capacity → insert registration → increment `participants_count` via RPC.
  - `eventsFeedService.publishHighlight` mirrors approved events into the global feed.

### 3. Feed & Social Graph
- Tables: `posts`, `post_attachments`, `post_reactions`, `comments`, `comment_reactions`, `follows`.
- Services guard rate limits (per user/per hour) and enforce attachment scanning using `lib/sync.ts`.
- Aggregations moved to materialized views:
  - `feed_post_stats_mv` (likes/comments counts) refreshed via trigger on mutation tables.

### 4. Alerts & Notifications
- Tables: `alerts`, `alert_recipients`, `notifications`, `notification_preferences`.
- Email pipeline lives under `lib/email/alerts` with SendGrid or Supabase SMTP fallback.
- Digest builder runs via Supabase cron invoking `supabase/space_functions.sql` entry `call_digest_builder()`.

### 5. Profile & Integrations
- Tables: `profiles`, `profile_integrations`, `coding_stats_unified`, `profile_projects`, `profile_experience`, `profile_education`, `profile_skills`.
- Integrations manager (`lib/profile/integrations/manager.ts`) now operates as an event consumer:
  1. User links an integration → `profile_integrations` entry created.
  2. Background job fetches provider stats, encrypts provider tokens via `lib/encryption.ts`, and writes normalized stats to `coding_stats_unified`.
  3. Leveling service recomputes XP tiers stored on `profiles.level`.

## Data Access Guidelines

1. **Server-side Supabase client only**: `lib/supabase-server.ts` injects RLS context through the Next.js session. Client-side hooks fetch via server actions or typed fetchers under `lib/clients`.
2. **Type-safe responses**: map queries to `types/events.ts`, `types/spaces.ts`, etc., and centralize row selectors in repositories to avoid drift between SQL and TS types.
3. **RLS-first design**: assume every table is RLS-enabled. Policies match domain boundaries (e.g., `space_members` policy uses `auth.uid() = user_id`).
4. **Background operations**: expensive work (sync integrations, send emails, fan-out notifications) moves to Supabase Functions invoked via RPC or `supabase/functions/*` edge functions.

## Observability & Reliability

- **Tracing**: attach `x-cc-request-id` in middleware and propagate through domain services for log correlation.
- **Metrics**: expose events per minute, failed logins, and sync latency via a lightweight `/api/debug/metrics` endpoint (gated by admin policy) sourcing from `lib/sync.ts` counters.
- **Feature Flags**: `lib/utils.ts` reads from `public.feature_flags` view allowing gradual rollouts per space or cohort.
- **Disaster Recovery**: nightly `pg_dump` via Supabase backups + object storage versioning for user uploads.

## Deployment Model

- Primary region: `ap-south-1` (Supabase) to minimize latency for the campus user base.
- Next.js hosted on Vercel with region pinning to Singapore (close to Supabase).
- Environment promotion: `dev` → `staging` → `prod` using linked Supabase projects. Migrations flow via `supabase/migrations/<timestamp>_<name>.sql` and are applied through CI before deploying frontend changes.

## Migration Strategy

1. Inventory existing tables using the SQL in `supabase/*.sql`; reconcile differences with TypeScript models.
2. Introduce new tables/views incrementally with migrations guarded by feature flags.
3. Backfill data via `supabase/fix_*` scripts; validate using `supabase/debug_*.sql` utilities already present.
4. Update API handlers/server actions to call the new domain services, then remove legacy direct queries.
5. Freeze deprecated endpoints after verifying real-time subscriptions emit from the new channels.

---

This document should serve as the canonical reference while implementing the rebuild. Update each section as modules evolve to prevent drift between documentation and code.
