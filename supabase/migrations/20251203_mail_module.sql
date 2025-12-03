-- Mail Module Schema

-- 1. MAILS TABLE
create table if not exists public.mails (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  gmail_id text unique, -- Nullable for drafts not yet synced
  thread_id text,
  subject text,
  body text, -- Stores snippet or full body content
  "from" text, -- Quoted because 'from' is a reserved keyword
  "to" text, -- Quoted because 'to' is a reserved keyword
  timestamp timestamptz default now(),
  is_read boolean default false,
  is_starred boolean default false,
  category text check (category in ('inbox', 'sent', 'draft', 'spam', 'trash')) not null,
  labels text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. INDEXES
create index if not exists idx_mails_user_category on public.mails(user_id, category);
create index if not exists idx_mails_user_timestamp on public.mails(user_id, timestamp desc);
create index if not exists idx_mails_gmail_id on public.mails(gmail_id);

-- 3. RLS POLICIES
alter table public.mails enable row level security;

drop policy if exists "Users can view their own mails" on public.mails;
create policy "Users can view their own mails" on public.mails for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own mails" on public.mails;
create policy "Users can insert their own mails" on public.mails for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own mails" on public.mails;
create policy "Users can update their own mails" on public.mails for update using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own mails" on public.mails;
create policy "Users can delete their own mails" on public.mails for delete using ( auth.uid() = user_id );

-- 4. TRIGGERS
-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_mails_updated_at
before update on public.mails
for each row
execute function update_updated_at_column();
