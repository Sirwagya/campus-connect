-- Fix the relationship between comments and users tables
-- The API needs to join comments with public.users, so we need a Foreign Key pointing to public.users

-- 1. Drop existing FK on comments.user_id (likely pointing to auth.users)
-- We use a DO block to find and drop it because the name might vary
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'comments' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name != 'comments_post_id_fkey' -- Don't drop the post FK
    )
    LOOP
        EXECUTE 'ALTER TABLE public.comments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 2. Add new FK pointing to public.users
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- 3. Reload schema cache to ensure API picks up the change
NOTIFY pgrst, 'reload config';
