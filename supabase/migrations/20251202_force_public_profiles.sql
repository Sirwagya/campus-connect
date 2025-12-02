-- Force all profiles to be public to ensure visibility
UPDATE public.profiles SET visibility = 'public' WHERE visibility IS NULL OR visibility = 'private';

-- Ensure default is public
ALTER TABLE public.profiles ALTER COLUMN visibility SET DEFAULT 'public';

-- Re-apply RLS policy just in case
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (visibility = 'public' OR auth.uid() = id);
