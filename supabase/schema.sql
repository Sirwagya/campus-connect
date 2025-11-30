-- Users table
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text check (role in ('student', 'core', 'admin')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Spaces table
create table public.spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  type text check (type in ('club', 'global')) not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Space Members table
create table public.space_members (
  space_id uuid references public.spaces not null,
  user_id uuid references public.users not null,
  role text check (role in ('member', 'admin')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (space_id, user_id)
);

-- Posts table (Feed)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  content text not null,
  likes_count int default 0,
  comments_count int default 0,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  venue text,
  date timestamp with time zone not null,
  status text check (status in ('pending', 'approved')) default 'pending',
  created_by uuid references public.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Registrations table
create table public.registrations (
  event_id uuid references public.events not null,
  user_id uuid references public.users not null,
  status text default 'registered',
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (event_id, user_id)
);

-- Messages table (Spaces)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces not null,
  user_id uuid references public.users not null,
  content text not null,
  parent_id uuid references public.messages,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
