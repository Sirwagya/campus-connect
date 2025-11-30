-- Fix Insert Policy for Spaces

-- Drop the existing policy to be sure
drop policy if exists "Users can create spaces" on public.spaces;

-- Recreate it with the correct check
create policy "Users can create spaces" on public.spaces
  for insert with check (
    auth.uid() = owner_id
  );

-- Also ensure authenticated users can insert
grant insert on public.spaces to authenticated;
