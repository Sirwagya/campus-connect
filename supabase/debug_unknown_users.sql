-- Find posts where the author name is missing
SELECT 
  p.id as post_id, 
  p.content, 
  p.user_id, 
  u.email, 
  u.full_name, 
  u.name
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE u.full_name IS NULL AND u.name IS NULL;
