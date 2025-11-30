-- Fix ALL users who have missing names or avatars
-- This ensures no post ever shows "Unknown"

UPDATE public.users
SET 
  -- If name is missing, try full_name, otherwise use the email prefix (e.g. "john" from "john@example.com")
  name = COALESCE(
    name, 
    full_name, 
    initcap(split_part(email, '@', 1))
  ),
  -- Same for full_name
  full_name = COALESCE(
    full_name, 
    name, 
    initcap(split_part(email, '@', 1))
  ),
  -- Generate a random avatar if missing
  avatar_url = COALESCE(
    avatar_url, 
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id
  )
WHERE name IS NULL OR full_name IS NULL OR avatar_url IS NULL;

-- Show the results to confirm everyone has a name now
SELECT id, email, name, full_name FROM public.users;
