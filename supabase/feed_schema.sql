-- Feed Module Schema

-- 1. POSTS TABLE
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null, -- text / markdown / HTML (sanitized)
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  reply_to uuid references public.posts(id), -- for replies
  likes_count int not null default 0,
  comments_count int not null default 0,
  shares_count int not null default 0,
  attachments jsonb default '[]'::jsonb, -- array of {url, type}
  is_flagged boolean default false
);

-- 2. LIKES TABLE
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- 3. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. FLAGS TABLE (Moderation)
create table if not exists public.post_flags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists comments_post_id_idx on public.comments (post_id);

-- Enable RLS
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.post_flags enable row level security;

-- RLS Policies

-- Posts: Everyone can view
create policy "Public can view posts" on public.posts
  for select using (true);

-- Posts: Authenticated users can insert their own
create policy "Users can insert own posts" on public.posts
  for insert with check (auth.uid() = user_id);

-- Posts: Users can update/delete their own
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = user_id);

-- Likes: Everyone can view
create policy "Public can view likes" on public.post_likes
  for select using (true);

-- Likes: Authenticated users can toggle likes
create policy "Users can insert likes" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete likes" on public.post_likes
  for delete using (auth.uid() = user_id);

-- Comments: Everyone can view
create policy "Public can view comments" on public.comments
  for select using (true);

-- Comments: Authenticated users can insert
create policy "Users can insert comments" on public.comments
  for insert with check (auth.uid() = user_id);

-- Storage Bucket Setup (Instructional)
-- You need to create a public bucket named 'post-attachments' in Supabase Storage.
-- Policy: "Public Access" -> SELECT for all.
-- Policy: "Authenticated Upload" -> INSERT for authenticated users.
