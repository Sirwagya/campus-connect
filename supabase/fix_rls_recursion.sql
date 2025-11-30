-- Fix Infinite Recursion in RLS Policies

-- 1. Create a secure function to check membership (Bypasses RLS)
create or replace function public.is_space_member(_space_id uuid, _user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.space_members
    where space_id = _space_id and user_id = _user_id
  );
end;
$$ language plpgsql security definer;

-- 2. Drop existing problematic policies
drop policy if exists "Public spaces are viewable by everyone" on public.spaces;
drop policy if exists "Members are viewable by everyone in public spaces or members" on public.space_members;

-- 3. Re-create Spaces Policy
create policy "Public spaces are viewable by everyone" on public.spaces
  for select using (
    (not is_private) 
    OR 
    public.is_space_member(id, auth.uid())
  );

-- 4. Re-create Space Members Policy
create policy "Members are viewable by everyone in public spaces or members" on public.space_members
  for select using (
    -- I can see my own membership
    (user_id = auth.uid())
    OR
    -- I can see members of public spaces
    (exists (
      select 1 from public.spaces 
      where id = space_id 
      and is_private = false
    ))
    OR
    -- I can see members of spaces I belong to
    public.is_space_member(space_id, auth.uid())
  );
