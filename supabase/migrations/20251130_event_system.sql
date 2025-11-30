-- Event System Migration: Teams & Dynamic Forms

-- 1. Update Events Table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS participation_type text DEFAULT 'solo' CHECK (participation_type IN ('solo', 'team', 'both')),
ADD COLUMN IF NOT EXISTS min_team_size int DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_size int DEFAULT 1;

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  leader_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable if not yet registered
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz
);

-- 4. Update Registrations
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS form_response_id uuid REFERENCES public.event_form_responses(id) ON DELETE SET NULL;

-- 5. RLS Policies

-- Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Team leaders can update teams" ON public.teams FOR UPDATE USING (auth.uid() = leader_id);

CREATE POLICY "Team leaders can delete teams" ON public.teams FOR DELETE USING (auth.uid() = leader_id);

CREATE POLICY "Admins manage teams" ON public.teams FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read team members" ON public.team_members FOR SELECT USING (true);

CREATE POLICY "Team leaders can add members" ON public.team_members FOR INSERT WITH CHECK (
  exists (select 1 from public.teams where teams.id = team_id and teams.leader_id = auth.uid())
);

CREATE POLICY "Team leaders can update members" ON public.team_members FOR UPDATE USING (
  exists (select 1 from public.teams where teams.id = team_id and teams.leader_id = auth.uid())
);

CREATE POLICY "Team leaders can remove members" ON public.team_members FOR DELETE USING (
  exists (select 1 from public.teams where teams.id = team_id and teams.leader_id = auth.uid())
);

CREATE POLICY "Users can join/leave as members" ON public.team_members FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage team members" ON public.team_members FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
