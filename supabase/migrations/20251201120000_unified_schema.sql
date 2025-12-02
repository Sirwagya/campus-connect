-- Migration: Align database with docs/UNIFIED_SCHEMA.md (generated manually)
-- Run with `supabase db push` after reviewing + adjusting for environment-specific data.

create extension if not exists "pgcrypto" with schema public;
create extension if not exists "citext" with schema public;
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;
-- ------------------------------------------------------------------
-- users
-- ------------------------------------------------------------------
alter table public.users
  add column if not exists onboarding_state text default 'pending',
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_email_key'
  ) then
    alter table public.users
      add constraint users_email_key unique (email);
  end if;
end;
$$;
drop trigger if exists set_timestamp_users on public.users;
create trigger set_timestamp_users
before update on public.users
for each row execute function public.set_updated_at();
-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  username citext unique,
  display_name text,
  bio text,
  tagline text,
  avatar_url text,
  cover_url text,
  visibility text check (visibility in ('public','private')) default 'public',
  social_links jsonb default '{}'::jsonb,
  level text default 'novice',
  xp integer default 0,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
alter table public.profiles
  add column if not exists username citext,
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists tagline text,
  add column if not exists avatar_url text,
  add column if not exists cover_url text,
  add column if not exists visibility text default 'public',
  add column if not exists social_links jsonb default '{}'::jsonb,
  add column if not exists level text default 'novice',
  add column if not exists xp integer default 0,
  add column if not exists created_at timestamptz default timezone('utc', now()) not null,
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
drop trigger if exists set_timestamp_profiles on public.profiles;
create trigger set_timestamp_profiles
before update on public.profiles
for each row execute function public.set_updated_at();
-- ------------------------------------------------------------------
-- spaces + messaging
-- ------------------------------------------------------------------
alter table public.spaces
  add column if not exists slug citext,
  add column if not exists visibility text default 'public',
  add column if not exists banner_url text,
  add column if not exists created_by uuid references public.users (id),
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
update public.spaces
set slug = coalesce(slug, regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null;
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'spaces_slug_key'
  ) then
    begin
      alter table public.spaces
        add constraint spaces_slug_key unique (slug);
    exception when others then
      null; -- handle duplicates manually if needed
    end;
  end if;
end;
$$;
-- enforce cascade deletes on membership foreign keys
alter table public.space_members
  drop constraint if exists space_members_space_id_fkey,
  add constraint space_members_space_id_fkey foreign key (space_id)
    references public.spaces (id) on delete cascade;
alter table public.space_members
  drop constraint if exists space_members_user_id_fkey,
  add constraint space_members_user_id_fkey foreign key (user_id)
    references public.users (id) on delete cascade;
alter table public.space_members
  add column if not exists status text default 'pending',
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
drop trigger if exists set_timestamp_space_members on public.space_members;
create trigger set_timestamp_space_members
before update on public.space_members
for each row execute function public.set_updated_at();
create table if not exists public.space_channels (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces (id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean default false,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
drop trigger if exists set_timestamp_space_channels on public.space_channels;
create trigger set_timestamp_space_channels
before update on public.space_channels
for each row execute function public.set_updated_at();
-- rename legacy messages table if needed
DO $$
BEGIN
  IF to_regclass('public.space_messages') IS NULL AND to_regclass('public.messages') IS NOT NULL THEN
    ALTER TABLE public.messages RENAME TO space_messages;
  END IF;
END;
$$;
alter table public.space_messages
  add column if not exists channel_id uuid references public.space_channels (id) on delete cascade,
  add column if not exists attachments jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
-- rename parent_id to reply_to when present
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_name='space_messages' and column_name='parent_id'
  ) THEN
    alter table public.space_messages rename column parent_id to reply_to;
  END IF;
END;
$$;
drop trigger if exists set_timestamp_space_messages on public.space_messages;
create trigger set_timestamp_space_messages
before update on public.space_messages
for each row execute function public.set_updated_at();
-- ------------------------------------------------------------------
-- events + registrations
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_name='events' and column_name='date'
  ) THEN
    alter table public.events rename column date to start_ts;
  END IF;
END;
$$;
alter table public.events
  add column if not exists summary text,
  add column if not exists description text,
  add column if not exists venue text,
  add column if not exists end_ts timestamptz,
  add column if not exists capacity integer,
  add column if not exists participants_count integer default 0,
  add column if not exists registration_type text default 'solo',
  add column if not exists min_team_size integer default 1,
  add column if not exists max_team_size integer default 4,
  add column if not exists status text default 'draft',
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
update public.events set end_ts = coalesce(end_ts, start_ts)
where end_ts is null;
-- refresh status constraint to new enum
DO $$
BEGIN
  IF EXISTS (
    select 1 from pg_constraint where conname = 'events_status_check'
  ) THEN
    alter table public.events drop constraint events_status_check;
  END IF;
  alter table public.events
    add constraint events_status_check
    check (status in ('draft','published','archived'));
END;
$$;
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events (id) on delete cascade,
  name text not null,
  invite_code text unique not null,
  leader_id uuid references public.users (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
drop trigger if exists set_timestamp_teams on public.teams;
create trigger set_timestamp_teams
before update on public.teams
for each row execute function public.set_updated_at();
DO $$
BEGIN
  IF to_regclass('public.event_registrations') IS NULL AND to_regclass('public.registrations') IS NOT NULL THEN
    alter table public.registrations rename to event_registrations;
  END IF;
END;
$$;
alter table public.event_registrations
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists team_id uuid references public.teams (id),
  add column if not exists form_response jsonb,
  add column if not exists status text default 'pending',
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
DO $$
BEGIN
  IF EXISTS (
    select 1 from pg_constraint where conrelid = 'public.event_registrations'::regclass and contype = 'p'
  ) THEN
    alter table public.event_registrations drop constraint event_registrations_pkey;
  END IF;
  alter table public.event_registrations add primary key (id);
END;
$$;
DO $$
BEGIN
  IF NOT EXISTS (
    select 1 from pg_constraint where conname = 'event_registrations_event_user_key'
  ) THEN
    alter table public.event_registrations
      add constraint event_registrations_event_user_key unique (event_id, user_id);
  END IF;
END;
$$;
-- ------------------------------------------------------------------
-- feed
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_name='posts' and column_name='content'
  ) THEN
    alter table public.posts rename column content to body;
  END IF;
END;
$$;
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_name='posts' and column_name='likes_count'
  ) THEN
    alter table public.posts rename column likes_count to like_count;
  END IF;
END;
$$;
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_name='posts' and column_name='comments_count'
  ) THEN
    alter table public.posts rename column comments_count to comment_count;
  END IF;
END;
$$;
alter table public.posts
  add column if not exists attachments jsonb default '[]'::jsonb,
  add column if not exists visibility text default 'public',
  add column if not exists space_id uuid references public.spaces (id),
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
alter table public.comments
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
drop trigger if exists set_timestamp_posts on public.posts;
create trigger set_timestamp_posts
before update on public.posts
for each row execute function public.set_updated_at();
drop trigger if exists set_timestamp_comments on public.comments;
create trigger set_timestamp_comments
before update on public.comments
for each row execute function public.set_updated_at();
create table if not exists public.post_reactions (
  post_id uuid references public.posts (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  emoji text default 'like',
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (post_id, user_id)
);
-- ------------------------------------------------------------------
-- alerts & notifications
-- ------------------------------------------------------------------
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  body text,
  status text check (status in ('draft','scheduled','sent','cancelled')) default 'draft',
  scheduled_for timestamptz,
  created_by uuid references public.users (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
alter table public.alerts
  add column if not exists subject text,
  add column if not exists body text,
  add column if not exists status text default 'draft',
  add column if not exists scheduled_for timestamptz,
  add column if not exists created_by uuid references public.users (id),
  add column if not exists created_at timestamptz default timezone('utc', now()) not null,
  add column if not exists updated_at timestamptz default timezone('utc', now()) not null;
-- convert bigint identity ids to uuid when migrating older tables
DO $$
BEGIN
  IF EXISTS (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alerts'
      and column_name = 'id'
      and data_type <> 'uuid'
  ) THEN
    alter table public.alerts drop constraint if exists alerts_pkey;
    alter table public.alerts add column if not exists id_uuid uuid default gen_random_uuid();
    update public.alerts set id_uuid = coalesce(id_uuid, gen_random_uuid());
    alter table public.alerts drop column id;
    alter table public.alerts rename column id_uuid to id;
    alter table public.alerts add primary key (id);
  END IF;
END;
$$;
drop trigger if exists set_timestamp_alerts on public.alerts;
create trigger set_timestamp_alerts
before update on public.alerts
for each row execute function public.set_updated_at();
create table if not exists public.alert_recipients (
  alert_id uuid references public.alerts (id) on delete cascade,
  user_id uuid references public.users (id),
  delivery_status text check (delivery_status in ('pending','sent','failed')) default 'pending',
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  primary key (alert_id, user_id)
);
drop trigger if exists set_timestamp_alert_recipients on public.alert_recipients;
create trigger set_timestamp_alert_recipients
before update on public.alert_recipients
for each row execute function public.set_updated_at();
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users (id),
  type text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
drop trigger if exists set_timestamp_notifications on public.notifications;
create trigger set_timestamp_notifications
before update on public.notifications
for each row execute function public.set_updated_at();
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  channels jsonb default '{"email":true,"push":true}'::jsonb,
  digest_frequency text default 'daily',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
drop trigger if exists set_timestamp_notification_preferences on public.notification_preferences;
create trigger set_timestamp_notification_preferences
before update on public.notification_preferences
for each row execute function public.set_updated_at();
-- ------------------------------------------------------------------
-- integrations & stats
-- ------------------------------------------------------------------
create table if not exists public.profile_integrations (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles (id) on delete cascade,
  platform text,
  username text,
  token_encrypted text,
  verified boolean default false,
  is_public boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);
drop trigger if exists set_timestamp_profile_integrations on public.profile_integrations;
create trigger set_timestamp_profile_integrations
before update on public.profile_integrations
for each row execute function public.set_updated_at();
create table if not exists public.coding_stats_unified (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users (id) on delete cascade,
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
drop trigger if exists set_timestamp_coding_stats on public.coding_stats_unified;
create trigger set_timestamp_coding_stats
before update on public.coding_stats_unified
for each row execute function public.set_updated_at();
-- ------------------------------------------------------------------
-- indexes
-- ------------------------------------------------------------------
create index if not exists idx_profiles_visibility on public.profiles (visibility);
create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_spaces_slug on public.spaces (slug);
create index if not exists idx_space_members_role on public.space_members (space_id, role);
create index if not exists idx_events_time on public.events (start_ts, end_ts);
create index if not exists idx_event_reg_user on public.event_registrations (user_id);
create index if not exists idx_posts_space on public.posts (space_id, created_at desc);
create index if not exists idx_alerts_status on public.alerts (status);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
