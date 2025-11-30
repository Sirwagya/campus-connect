-- Check for posts where the user_id does NOT exist in the users table
SELECT count(*) as orphaned_posts_count
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE u.id IS NULL;
