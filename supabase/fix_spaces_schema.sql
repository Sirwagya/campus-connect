-- FIX SPACES SCHEMA
-- The previous script failed because 'spaces' table already existed with a different schema.
-- This script will DROP the old tables and recreate them correctly.

-- 1. DROP OLD TABLES (CASCADE will remove dependent tables like space_members if they exist)
DROP TABLE IF EXISTS public.space_messages CASCADE;
DROP TABLE IF EXISTS public.speaker_requests CASCADE;
DROP TABLE IF EXISTS public.space_participants CASCADE;
DROP TABLE IF EXISTS public.space_members CASCADE; -- Old table name from previous schema
DROP TABLE IF EXISTS public.messages CASCADE; -- Old table name from previous schema
DROP TABLE IF EXISTS public.spaces CASCADE;

-- 2. RECREATE SPACES TABLE
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  is_live boolean default false,
  is_recorded boolean default false,
  recording_url text,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  started_at timestamptz
);

-- 3. RECREATE PARTICIPANTS TABLE
create type public.space_role as enum ('host', 'cohost', 'speaker', 'listener');

create table public.space_participants (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.space_role not null default 'listener',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (space_id, user_id)
);

-- 4. RECREATE REQUESTS TABLE
create type public.request_status as enum ('pending', 'approved', 'denied');

create table public.speaker_requests (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 5. RECREATE MESSAGES TABLE
create table public.space_messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- 6. INDEXES
create index spaces_is_live_idx on public.spaces (is_live);
create index participants_space_idx on public.space_participants (space_id);
create index messages_space_idx on public.space_messages (space_id);

-- 7. RLS POLICIES
alter table public.spaces enable row level security;
alter table public.space_participants enable row level security;
alter table public.speaker_requests enable row level security;
alter table public.space_messages enable row level security;

-- Spaces Policies
create policy "Spaces are viewable by everyone" on public.spaces for select using (true);
create policy "Users can create spaces" on public.spaces for insert with check (auth.uid() = host_id);
create policy "Hosts can update their spaces" on public.spaces for update using (auth.uid() = host_id);

-- Participants Policies
create policy "Participants are viewable by everyone" on public.space_participants for select using (true);
create policy "Users can join/leave" on public.space_participants for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Speaker Requests Policies
create policy "Requests are viewable by everyone" on public.speaker_requests for select using (true);
create policy "Users can create requests" on public.speaker_requests for insert with check (auth.uid() = user_id);
create policy "Hosts can update requests" on public.speaker_requests for update using (
  exists (select 1 from public.spaces where id = public.speaker_requests.space_id and host_id = auth.uid())
);

-- Messages Policies
create policy "Messages are viewable by everyone" on public.space_messages for select using (true);
create policy "Participants can send messages" on public.space_messages for insert with check (
  auth.uid() = user_id AND
  exists (select 1 from public.space_participants where space_id = public.space_messages.space_id and user_id = auth.uid() and left_at is null)
);

-- 8. REALTIME
alter publication supabase_realtime add table public.spaces;
alter publication supabase_realtime add table public.space_participants;
alter publication supabase_realtime add table public.speaker_requests;
alter publication supabase_realtime add table public.space_messages;
