-- Function to increment member count
create or replace function increment_space_member_count(space_id uuid)
returns void as $$
begin
  update public.spaces
  set member_count = member_count + 1
  where id = space_id;
end;
$$ language plpgsql security definer;

-- Function to decrement member count (for leaving)
create or replace function decrement_space_member_count(space_id uuid)
returns void as $$
begin
  update public.spaces
  set member_count = member_count - 1
  where id = space_id;
end;
$$ language plpgsql security definer;
