create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('space_invite', 'system')),
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Allow system/functions to insert (or anyone if we want users to trigger invites directly via API)
-- For now, let's allow authenticated users to insert if they are inviting someone (we'll validate in API)
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');
