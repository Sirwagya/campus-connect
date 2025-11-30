-- Fix Select Policy for Spaces
-- Allow owners to see their own spaces immediately upon creation

drop policy if exists "Public spaces are viewable by everyone" on public.spaces;

create policy "Public spaces are viewable by everyone" on public.spaces
  for select using (
    (not is_private) 
    OR 
    public.is_space_member(id, auth.uid())
    OR
    owner_id = auth.uid()
  );
