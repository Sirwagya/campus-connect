-- Function to check if the current user is an admin
-- Bypasses RLS by using SECURITY DEFINER
create or replace function public.am_i_admin()
returns boolean
language plpgsql
security definer
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin
  from public.users
  where id = auth.uid();
  
  return coalesce(v_is_admin, false);
end;
$$;
