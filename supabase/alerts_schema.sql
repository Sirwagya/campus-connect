-- Robust setup for Alerts Module (Safe to run if tables exist)

-- 1. USERS TABLE
-- Create users table if it doesn't exist (referencing auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- Add columns for Core App (if missing)
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists role text check (role in ('student', 'core', 'admin')) default 'student';

-- Add columns for Alerts Module (if missing)
alter table public.users add column if not exists name text; -- Used by Alerts module
alter table public.users add column if not exists avatar text; -- Used by Alerts module
alter table public.users add column if not exists google_id text unique;
alter table public.users add column if not exists access_token text;
alter table public.users add column if not exists refresh_token text;
alter table public.users add column if not exists token_expiry bigint;
alter table public.users add column if not exists last_sync timestamptz;
alter table public.users add column if not exists roles text[] default '{}';

-- Enable RLS on users
alter table public.users enable row level security;

-- Users Policies
drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile" on public.users for select using ( auth.uid() = id );

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" on public.users for update using ( auth.uid() = id );


-- 2. ALERTS TABLE
create table if not exists public.alerts (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  gmail_id text not null,
  thread_id text,
  from_email text,
  to_email text,
  subject text,
  snippet text,
  body_text text,
  body_html text,
  labels text[],
  starred boolean default false,
  unread boolean default false,
  received_at timestamptz not null,
  fetched_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, gmail_id)
);

-- Enable RLS on alerts
alter table public.alerts enable row level security;

-- Alerts Policies
drop policy if exists "Users can view their own alerts" on public.alerts;
create policy "Users can view their own alerts" on public.alerts for select using ( auth.uid() = user_id );

drop policy if exists "Users can update their own alerts" on public.alerts;
create policy "Users can update their own alerts" on public.alerts for update using ( auth.uid() = user_id );

-- 3. INDEXES
create index if not exists idx_alerts_user_received on public.alerts(user_id, received_at desc);
-- Full text search index (simple version)
create index if not exists idx_alerts_search on public.alerts using gin(to_tsvector('english', subject || ' ' || from_email || ' ' || snippet || ' ' || coalesce(body_text, '')));
