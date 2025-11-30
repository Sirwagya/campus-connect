-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX THE ERROR

-- 1. Create Teams table FIRST
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  leader_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Team Members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz
);

-- 3. Add missing columns to event_registrations (Now that teams exists)
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS form_response_id uuid REFERENCES public.event_form_responses(id) ON DELETE SET NULL;

-- 4. Add missing columns to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS participation_type text DEFAULT 'solo' CHECK (participation_type IN ('solo', 'team', 'both')),
ADD COLUMN IF NOT EXISTS min_team_size int DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_size int DEFAULT 1;

-- 5. Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 6. Add basic policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Public read teams') THEN
        CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Users can create teams') THEN
        CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Public read team members') THEN
        CREATE POLICY "Public read team members" ON public.team_members FOR SELECT USING (true);
    END IF;
END $$;
