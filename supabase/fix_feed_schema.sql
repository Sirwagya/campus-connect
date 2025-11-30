-- Fix missing columns in posts table
-- Run this to add columns that were missing because the table already existed

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.posts(id),
ADD COLUMN IF NOT EXISTS shares_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Ensure other tables exist (just in case)
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_flags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

-- Re-apply RLS policies just to be safe
alter table public.posts enable row level security;

drop policy if exists "Public can view posts" on public.posts;
create policy "Public can view posts" on public.posts for select using (true);

drop policy if exists "Users can insert own posts" on public.posts;
create policy "Users can insert own posts" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);
