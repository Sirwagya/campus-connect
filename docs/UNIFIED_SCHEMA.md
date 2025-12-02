# Unified Database Schema & RLS Plan

_Last updated: 1 Dec 2025_

## Design Principles

1. **Single source of truth**: `supabase/schema.sql` + migrations own base tables; feature-specific overrides live under `supabase/<domain>_schema.sql` for readability but are imported into the main schema.
2. **UUID everywhere**: all primary keys use `gen_random_uuid()` and follow `id` naming. Foreign keys suffix with `_id`.
3. **Audit fields**: every table includes `created_at timestamptz default timezone('utc', now())` and `updated_at timestamptz default timezone('utc', now())` (with trigger to auto-update).
4. **Soft deletes via status**: avoid hard deletes; add `status` or `archived_at` columns.
5. **Enable extensions once**: `create extension if not exists citext with schema public;` lives at the top of `schema.sql` so the citext columns here stay valid across environments.
6. **RLS-first**: tables remain inaccessible until explicit policies exist. Policies are grouped by domain for clarity.

## Core Identity

```sql
create table public.users (
  id uuid references auth.users primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  role text check (role in ('student','core','admin')) default 'student',
  onboarding_state text default 'pending',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  username citext unique,
  display_name text,
  bio text,
  tagline text,
  avatar_url text,
  cover_url text,
  visibility text check (visibility in ('public','private')) default 'public',
  social_links jsonb default '{}',
  level text default 'novice',
  xp integer default 0,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
```

**Indexes**
- `create index idx_profiles_visibility on public.profiles (visibility);`
- `create index idx_users_role on public.users (role);`

**Policies**
- `profiles_select_public`: allow select when `visibility = 'public'` or `auth.uid() = id`.
- `profiles_modify_self`: allow update/delete when `auth.uid() = id`.
- `users_select_self`: allow select for admins + owners.

## Spaces Domain

```sql
create table public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug citext not null unique,
  description text,
  type text check (type in ('club','global')) default 'club',
  visibility text check (visibility in ('public','private','hidden')) default 'public',
  logo_url text,
  banner_url text,
  created_by uuid references public.users not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.space_members (
  space_id uuid references public.spaces on delete cascade,
  user_id uuid references public.users on delete cascade,
  role text check (role in ('member','moderator','owner')) default 'member',
  status text check (status in ('pending','active','banned','left')) default 'pending',
  joined_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  primary key (space_id, user_id)
);

create table public.space_channels (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean default false,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.space_messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.space_channels on delete cascade,
  space_id uuid references public.spaces on delete cascade,
  user_id uuid references public.users,
  content text,
  attachments jsonb default '[]'::jsonb,
  reply_to uuid references public.space_messages,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
```

**Policies**
- `spaces_public_select`: anyone can read metadata for `visibility = 'public'`.
- `space_membership_required`: select/insert on `space_messages` only when `auth.uid()` is active member.
- Admin override via `am_i_admin()`.

## Events Domain

```sql
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  description text,
  venue text,
  start_ts timestamptz not null,
  end_ts timestamptz not null,
  capacity integer check (capacity > 0),
  participants_count integer default 0,
  registration_type text check (registration_type in ('solo','team','both')) default 'solo',
  min_team_size integer default 1,
  max_team_size integer default 4,
  status text check (status in ('draft','published','archived')) default 'draft',
  created_by uuid references public.users,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.event_registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events on delete cascade,
  user_id uuid references public.users on delete cascade,
  team_id uuid references public.teams,
  form_response jsonb,
  status text check (status in ('pending','confirmed','cancelled')) default 'pending',
  registered_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (event_id, user_id)
);

create table public.teams (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events on delete cascade,
  name text not null,
  invite_code text unique not null,
  leader_id uuid references public.users,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
```

**Indexes**
- `create index idx_event_time on public.events (start_ts, end_ts);`
- `create index idx_event_reg_user on public.event_registrations (user_id);`

**Policies**
- Events readable when `status = 'published'` or `created_by = auth.uid()` or admin.
- Registrations insert/select require membership in target space (if event scoped), enforced via `exists` subquery.
- `events_manage_own`: allow update/delete when `auth.uid() = created_by`.

## Feed Domain

```sql
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  visibility text check (visibility in ('public','space')) default 'public',
  space_id uuid references public.spaces,
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.users,
  body text not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.post_reactions (
  post_id uuid references public.posts on delete cascade,
  user_id uuid references public.users on delete cascade,
  emoji text default 'like',
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (post_id, user_id)
);
```

**Materialized Views**
- `feed_post_stats_mv (post_id, like_count, comment_count, last_activity_at)` refreshed via trigger on posts/comments/reactions.

**Policies**
- Public posts visible to anyone authenticated.
- Space posts require membership.
- Only authors can update/delete.

## Alerts & Notifications

```sql
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  body text,
  status text check (status in ('draft','scheduled','sent','cancelled')) default 'draft',
  scheduled_for timestamptz,
  created_by uuid references public.users,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.alert_recipients (
  alert_id uuid references public.alerts on delete cascade,
  user_id uuid references public.users,
  delivery_status text check (delivery_status in ('pending','sent','failed')) default 'pending',
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  primary key (alert_id, user_id)
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users,
  type text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.notification_preferences (
  user_id uuid primary key references public.users on delete cascade,
  channels jsonb default '{"email":true,"push":true}'::jsonb,
  digest_frequency text default 'daily',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
```

## Coding Integrations & Portfolio

```sql
create table public.profile_integrations (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete cascade,
  platform text,
  username text,
  token_encrypted text,
  verified boolean default false,
  is_public boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create table public.coding_stats_unified (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  total_xp integer default 0,
  github_commits integer,
  leetcode_solved integer,
  codeforces_rating integer,
  hackerrank_badges integer,
  current_streak integer,
  snapshot jsonb,
  synced_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
```

## Row Level Security Matrix

| Table | Policies |
|-------|----------|
| users | select self, admins; update self |
| profiles | select public or self; update self; admin override |
| spaces | select public; select private if member; modify owner/admin |
| space_members | select when `auth.uid() = user_id` or space admin; insert via invitation flow only |
| space_messages | select/insert when `auth.uid()` active member; update/delete only author or moderator |
| events | select published; manage when creator or admin |
| event_registrations | select/modify own registration; admin override |
| posts/comments/reactions | select when post visible; mutate when owner |
| alerts/alert_recipients | select/manage only admins |
| notifications/preferences | select/update self |
| profile_integrations/coding_stats_unified | select/update self; admin read for support |

Each policy lives inside dedicated files (e.g., `supabase/check_users_policies.sql`) and is applied via migrations to keep drift minimal.

## Maintenance & Tooling

- Use `supabase/db diff --linked` to generate migrations after editing schema files.
- Run `supabase/scripts/check_*` SQL files (already in repo) before deploy to ensure constraints and policies remain consistent.
- Keep `types/*.ts` updated via `supabase gen types typescript --project-ref <ref>` and auto-commit diffs.

## Migration & Testing Checklist

1. Update `supabase/schema.sql` (this document mirrors that file) and run `supabase db diff --linked --schema public` to emit a versioned migration under `supabase/migrations/` (or use the handcrafted baseline in `supabase/migrations/20251201120000_unified_schema.sql` if the CLI is unavailable).
2. Apply the migration to the linked Supabase project via `supabase db push --linked` (for dev/staging) or through CI in production.
3. Re-run the validation utilities already present in `supabase/check_*.sql` plus `supabase/test_rpc.sql` to confirm constraints, RLS, and RPC contracts still hold.
4. Regenerate generated types with `supabase gen types typescript --project-ref <ref> --schema public > types/database.ts` and ensure the frontend compiles without type errors.
5. Exercise high-risk flows locally (space creation, event registration, feed posting) using the updated schema to catch missing indexes or policy gaps before release.

This schema plan replaces scattered definitions across `supabase/*.sql` and should be treated as the authoritative reference for future development.
