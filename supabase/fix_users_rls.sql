-- Enable RLS on users table (if not already)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create policy to allow everyone to view profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- Also allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'users';
