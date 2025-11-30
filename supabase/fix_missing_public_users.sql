-- SUPER FIX SCRIPT
-- Run this to fix "Unknown" users once and for all.

-- 1. Sync users from auth.users to public.users if they are missing
-- This fixes cases where the user exists but the profile record is missing
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 2. Now that everyone is in public.users, fix the names again
UPDATE public.users
SET 
  name = COALESCE(name, full_name, split_part(email, '@', 1)),
  full_name = COALESCE(full_name, name, split_part(email, '@', 1)),
  avatar_url = COALESCE(avatar_url, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id)
WHERE name IS NULL OR full_name IS NULL OR avatar_url IS NULL;

-- 3. Check for any remaining orphaned posts (posts pointing to IDs that don't exist in public.users)
-- We assign them to YOU (the main user) so they don't look broken.
-- Using your ID: 8de583fb-b8b6-4928-ada8-9b4106efb01f
UPDATE public.posts
SET user_id = '8de583fb-b8b6-4928-ada8-9b4106efb01f'
WHERE user_id NOT IN (SELECT id FROM public.users);

-- 4. Verify results
SELECT count(*) as remaining_orphans FROM public.posts WHERE user_id NOT IN (SELECT id FROM public.users);
