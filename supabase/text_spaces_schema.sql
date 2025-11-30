-- TEXT SPACES SCHEMA (Group Chat)
-- Replaces previous Audio Spaces schema

-- 1. CLEANUP (Drop old tables if they exist)
DROP TABLE IF EXISTS public.space_message_reactions CASCADE;
DROP TABLE IF EXISTS public.space_invites CASCADE;
DROP TABLE IF EXISTS public.space_messages CASCADE;
DROP TABLE IF EXISTS public.speaker_requests CASCADE; -- From audio spaces
DROP TABLE IF EXISTS public.space_participants CASCADE; -- From audio spaces
DROP TABLE IF EXISTS public.space_members CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;

DROP TYPE IF EXISTS public.space_role CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;

-- 2. SPACES TABLE
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  is_private boolean default false,
  owner_id uuid not null references public.users(id) on delete cascade,
  tags text[] default '{}',
  member_count int default 1, -- Starts with owner
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. SPACE MEMBERS TABLE
create type public.space_role as enum ('owner', 'moderator', 'member');

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.space_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (space_id, user_id)
);

-- 4. SPACE MESSAGES TABLE
create table public.space_messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  mime text default 'text/plain', -- 'text/plain', 'text/markdown', 'text/html' (if sanitized)
  reply_to uuid references public.space_messages(id) on delete set null,
  is_edited boolean default false,
  is_deleted boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. REACTIONS TABLE
create table public.space_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.space_messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

-- 6. INVITES TABLE
create table public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  code text unique not null,
  created_by uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz,
  max_uses int,
  uses int default 0,
  created_at timestamptz not null default now()
);

-- 7. INDEXES
create index spaces_slug_idx on public.spaces (slug);
create index spaces_tags_idx on public.spaces using gin (tags);
create index members_space_user_idx on public.space_members (space_id, user_id);
create index messages_space_created_idx on public.space_messages (space_id, created_at desc);

-- 8. RLS POLICIES
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_messages enable row level security;
alter table public.space_message_reactions enable row level security;
alter table public.space_invites enable row level security;

-- Spaces
create policy "Public spaces are viewable by everyone" on public.spaces
  for select using (not is_private OR (auth.uid() in (select user_id from public.space_members where space_id = id)));

create policy "Users can create spaces" on public.spaces
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update spaces" on public.spaces
  for update using (auth.uid() = owner_id);

-- Members
create policy "Members are viewable by everyone in public spaces or members" on public.space_members
  for select using (
    exists (
      select 1 from public.spaces
      where id = space_id
      and (not is_private OR auth.uid() in (select user_id from public.space_members where space_id = spaces.id))
    )
  );

create policy "Users can join public spaces" on public.space_members
  for insert with check (
    auth.uid() = user_id AND
    exists (
      select 1 from public.spaces
      where id = space_id
      and (not is_private OR exists (select 1 from public.space_invites where space_id = spaces.id)) -- Simplified check, real invite logic in API
    )
  );

-- Messages
create policy "Messages viewable by members" on public.space_messages
  for select using (
    exists (
      select 1 from public.spaces
      where id = space_id
      and (not is_private OR auth.uid() in (select user_id from public.space_members where space_id = spaces.id))
    )
  );

create policy "Members can post messages" on public.space_messages
  for insert with check (
    auth.uid() = author_id AND
    exists (select 1 from public.space_members where space_id = space_messages.space_id and user_id = auth.uid())
  );

create policy "Authors and mods can update/delete messages" on public.space_messages
  for update using (
    auth.uid() = author_id OR
    exists (select 1 from public.space_members where space_id = space_messages.space_id and user_id = auth.uid() and role in ('owner', 'moderator'))
  );

-- Reactions
create policy "Reactions viewable by members" on public.space_message_reactions
  for select using (true); -- Simplified for now

create policy "Members can react" on public.space_message_reactions
  for insert with check (auth.uid() = user_id);

create policy "Users can remove own reactions" on public.space_message_reactions
  for delete using (auth.uid() = user_id);

-- 9. REALTIME
alter publication supabase_realtime add table public.space_messages;
alter publication supabase_realtime add table public.space_message_reactions;
-- We don't necessarily need realtime for spaces/members unless we want live counts
