-- Core extensions used across the project
create extension if not exists "pgcrypto" with schema public;
create extension if not exists "citext" with schema public;

-- Shared trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------
-- Identity
-- ------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id),
  email text not null unique,
  full_name text,
  avatar_url text,
  role text check (role in ('student','core','admin')) default 'student',
  onboarding_state text default 'pending',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_users
before update on public.users
for each row execute function public.set_updated_at();

create table public.profiles (
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

create trigger set_timestamp_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Spaces & Messaging
-- ------------------------------------------------------------------
create table public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug citext not null unique,
  description text,
  type text check (type in ('club','global')) default 'club',
  visibility text check (visibility in ('public','private','hidden')) default 'public',
  logo_url text,
  banner_url text,
  created_by uuid references public.users (id) not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_spaces
before update on public.spaces
for each row execute function public.set_updated_at();

create table public.space_members (
  space_id uuid references public.spaces (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  role text check (role in ('member','moderator','owner')) default 'member',
  status text check (status in ('pending','active','banned','left')) default 'pending',
  joined_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  primary key (space_id, user_id)
);

create trigger set_timestamp_space_members
before update on public.space_members
for each row execute function public.set_updated_at();

create table public.space_channels (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces (id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean default false,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_space_channels
before update on public.space_channels
for each row execute function public.set_updated_at();

create table public.space_messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references public.space_channels (id) on delete cascade,
  space_id uuid references public.spaces (id) on delete cascade,
  user_id uuid references public.users (id),
  content text,
  attachments jsonb default '[]'::jsonb,
  reply_to uuid references public.space_messages (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_space_messages
before update on public.space_messages
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Events & Registrations
-- ------------------------------------------------------------------
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
  created_by uuid references public.users (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_events
before update on public.events
for each row execute function public.set_updated_at();

create table public.teams (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events (id) on delete cascade,
  name text not null,
  invite_code text unique not null,
  leader_id uuid references public.users (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_teams
before update on public.teams
for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  team_id uuid references public.teams (id),
  form_response jsonb,
  status text check (status in ('pending','confirmed','cancelled')) default 'pending',
  registered_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  unique (event_id, user_id)
);

create trigger set_timestamp_event_registrations
before update on public.event_registrations
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Feed
-- ------------------------------------------------------------------
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users (id) on delete cascade,
  body text not null,
  attachments jsonb default '[]'::jsonb,
  visibility text check (visibility in ('public','space')) default 'public',
  space_id uuid references public.spaces (id),
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_posts
before update on public.posts
for each row execute function public.set_updated_at();

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts (id) on delete cascade,
  user_id uuid references public.users (id),
  body text not null,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_comments
before update on public.comments
for each row execute function public.set_updated_at();

create table public.post_reactions (
  post_id uuid references public.posts (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  emoji text default 'like',
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (post_id, user_id)
);

-- ------------------------------------------------------------------
-- Alerts & Notifications
-- ------------------------------------------------------------------
create table public.alerts (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  body text,
  status text check (status in ('draft','scheduled','sent','cancelled')) default 'draft',
  scheduled_for timestamptz,
  created_by uuid references public.users (id),
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_alerts
before update on public.alerts
for each row execute function public.set_updated_at();

create table public.alert_recipients (
  alert_id uuid references public.alerts (id) on delete cascade,
  user_id uuid references public.users (id),
  delivery_status text check (delivery_status in ('pending','sent','failed')) default 'pending',
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null,
  primary key (alert_id, user_id)
);

create trigger set_timestamp_alert_recipients
before update on public.alert_recipients
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users (id),
  type text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_notifications
before update on public.notifications
for each row execute function public.set_updated_at();

create table public.notification_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  channels jsonb default '{"email":true,"push":true}'::jsonb,
  digest_frequency text default 'daily',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

create trigger set_timestamp_notification_preferences
before update on public.notification_preferences
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Integrations & Stats
-- ------------------------------------------------------------------
create table public.profile_integrations (
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

create trigger set_timestamp_profile_integrations
before update on public.profile_integrations
for each row execute function public.set_updated_at();

create table public.coding_stats_unified (
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

create trigger set_timestamp_coding_stats
before update on public.coding_stats_unified
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Indexes to support common queries
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
