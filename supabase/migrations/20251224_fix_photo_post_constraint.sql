-- ================================================================
-- PERMANENT FIX: Allow Photo-Only Posts
-- Run this in Supabase SQL Editor
-- ================================================================

-- Drop the existing constraint that requires body to have at least 1 character
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_body_check;

-- Add new constraint that allows empty body when attachments exist
ALTER TABLE public.posts
  ADD CONSTRAINT posts_body_check
    CHECK (
      -- Allow empty/whitespace-only body if attachments array has items
      (
        (body IS NULL OR length(trim(body)) = 0)
        AND attachments IS NOT NULL 
        AND jsonb_array_length(attachments) > 0
      )
      -- OR require body to be between 1 and 5000 characters
      OR (length(trim(body)) BETWEEN 1 AND 5000)
    );

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'posts_body_check';
