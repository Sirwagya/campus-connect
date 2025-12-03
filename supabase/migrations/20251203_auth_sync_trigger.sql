-- Trigger to automatically create a public.users record when a new user signs up via Supabase Auth

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'student' -- Default role
  );
  
  -- Create a default profile
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    split_part(new.email, '@', 1), -- Default username from email
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Ensure the trigger doesn't already exist to avoid errors
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
