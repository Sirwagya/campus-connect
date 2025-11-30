-- Spaces Feature Schema

-- 1. SPACES TABLE
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  is_live boolean default false,
  is_recorded boolean default false,
  recording_url text, -- To store the final recording URL
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  started_at timestamptz -- When it actually went live
);

-- 2. SPACE PARTICIPANTS TABLE
-- Tracks who is currently in the room and their role
create type public.space_role as enum ('host', 'cohost', 'speaker', 'listener');

create table if not exists public.space_participants (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.space_role not null default 'listener',
  joined_at timestamptz not null default now(),
  left_at timestamptz, -- If null, they are currently in the room
  primary key (space_id, user_id)
);

-- 3. SPEAKER REQUESTS TABLE
-- Queue for listeners wanting to speak
create type public.request_status as enum ('pending', 'approved', 'denied');

create table if not exists public.speaker_requests (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 4. SPACE MESSAGES TABLE
-- Live chat history
create table if not exists public.space_messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- INDEXES
create index if not exists spaces_is_live_idx on public.spaces (is_live);
create index if not exists participants_space_idx on public.space_participants (space_id);
create index if not exists messages_space_idx on public.space_messages (space_id);

-- RLS POLICIES
alter table public.spaces enable row level security;
alter table public.space_participants enable row level security;
alter table public.speaker_requests enable row level security;
alter table public.space_messages enable row level security;

-- Spaces Policies
create policy "Spaces are viewable by everyone" on public.spaces
  for select using (true);

create policy "Users can create spaces" on public.spaces
  for insert with check (auth.uid() = host_id);

create policy "Hosts can update their spaces" on public.spaces
  for update using (auth.uid() = host_id);

-- Participants Policies
create policy "Participants are viewable by everyone" on public.space_participants
  for select using (true);

create policy "Users can join/leave (insert/update themselves)" on public.space_participants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Speaker Requests Policies
create policy "Requests are viewable by everyone" on public.speaker_requests
  for select using (true);

create policy "Users can create requests" on public.speaker_requests
  for insert with check (auth.uid() = user_id);

create policy "Hosts can update requests" on public.speaker_requests
  for update using (
    exists (
      select 1 from public.spaces
      where id = public.speaker_requests.space_id
      and host_id = auth.uid()
    )
  );

-- Messages Policies
create policy "Messages are viewable by everyone" on public.space_messages
  for select using (true);

create policy "Participants can send messages" on public.space_messages
  for insert with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.space_participants
      where space_id = public.space_messages.space_id
      and user_id = auth.uid()
      and left_at is null
    )
  );

-- REALTIME SETUP
-- Enable realtime for these tables so we can listen to changes
alter publication supabase_realtime add table public.spaces;
alter publication supabase_realtime add table public.space_participants;
alter publication supabase_realtime add table public.speaker_requests;
alter publication supabase_realtime add table public.space_messages;
