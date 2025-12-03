-- Fix RLS policy for profile_integrations to use correct column

-- Drop the incorrect policy if it exists
drop policy if exists "integrations_select" on public.profile_integrations;

-- Re-create with correct column (verified instead of verified_at)
create policy "integrations_select" on public.profile_integrations for select 
  using (user_id = auth.uid() or (is_public and verified = true));

-- Ensure RLS is enabled
alter table public.profile_integrations enable row level security;
