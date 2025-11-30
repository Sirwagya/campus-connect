-- Student Profile System Migration

-- 1. PROFILES (Extends public.users)
-- We'll use the existing public.users table as the base, but add profile-specific columns
-- or create a separate profiles table if we want to keep users lightweight.
-- Let's create a separate profiles table for cleaner separation, linked 1:1 to users.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio text,
  tagline text,
  resume_url text,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  theme text DEFAULT 'light',
  social_links jsonb DEFAULT '{}'::jsonb, -- { "github": "url", "linkedin": "url", ... }
  custom_sections jsonb DEFAULT '[]'::jsonb, -- Store order/visibility of sections
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. PROFILE INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.profile_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('github', 'leetcode', 'codeforces', 'codechef', 'hackerrank')),
  username text NOT NULL,
  platform_data jsonb DEFAULT '{}'::jsonb, -- Raw data from platform
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- 3. PROFILE SKILLS
CREATE TABLE IF NOT EXISTS public.profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  category text, -- 'frontend', 'backend', 'language', etc.
  proficiency text CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  endorsements_count int DEFAULT 0,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. PROFILE PROJECTS
CREATE TABLE IF NOT EXISTS public.profile_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  repo_url text,
  tech_stack text[],
  start_date date,
  end_date date,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. PROFILE EXPERIENCE
CREATE TABLE IF NOT EXISTS public.profile_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  description text,
  start_date date NOT NULL,
  end_date date, -- NULL means 'Present'
  is_current boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. PROFILE EDUCATION
CREATE TABLE IF NOT EXISTS public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  grade text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. PROFILE ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.profile_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date,
  url text,
  issuer text,
  type text CHECK (type IN ('certification', 'award', 'hackathon', 'other')),
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. PROFILE BADGES (Gamification)
CREATE TABLE IF NOT EXISTS public.profile_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  badge_code text NOT NULL, -- e.g., 'streak_30', 'leetcode_200'
  name text NOT NULL,
  description text,
  icon_url text,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_code)
);

-- 9. UNIFIED CODING STATS (For Dashboard/Leaderboard)
CREATE TABLE IF NOT EXISTS public.coding_stats_unified (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp int DEFAULT 0,
  current_level text DEFAULT 'Beginner',
  github_contributions int DEFAULT 0,
  leetcode_problems int DEFAULT 0,
  codeforces_rating int DEFAULT 0,
  hackerrank_badges int DEFAULT 0,
  last_updated_at timestamptz DEFAULT now()
);

-- 10. ACTIVITY TIMELINE
CREATE TABLE IF NOT EXISTS public.activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'milestone', 'project', 'achievement', 'event'
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_stats_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_timeline ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Public read if visibility is public, Owner read/write
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (visibility = 'public' OR auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Integrations: Owner only (usually contains tokens or sensitive sync data, though we store tokens in users table mostly)
-- Actually, we might want to show "Connected Accounts" on public profile? Let's allow public read for now if profile is public.
CREATE POLICY "Public integrations viewable" ON public.profile_integrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_integrations.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );

CREATE POLICY "Users manage integrations" ON public.profile_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Skills, Projects, Experience, Education, Achievements, Badges, Timeline
-- Same logic: Public if profile is public, Owner manages.

-- Helper macro for policies? No, let's write them out for clarity.

-- Skills
CREATE POLICY "Public skills viewable" ON public.profile_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_skills.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
CREATE POLICY "Users manage skills" ON public.profile_skills FOR ALL USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Public projects viewable" ON public.profile_projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_projects.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
CREATE POLICY "Users manage projects" ON public.profile_projects FOR ALL USING (auth.uid() = user_id);

-- Experience
CREATE POLICY "Public experience viewable" ON public.profile_experience
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_experience.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
CREATE POLICY "Users manage experience" ON public.profile_experience FOR ALL USING (auth.uid() = user_id);

-- Education
CREATE POLICY "Public education viewable" ON public.profile_education
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_education.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
CREATE POLICY "Users manage education" ON public.profile_education FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "Public achievements viewable" ON public.profile_achievements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_achievements.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
CREATE POLICY "Users manage achievements" ON public.profile_achievements FOR ALL USING (auth.uid() = user_id);

-- Badges
CREATE POLICY "Public badges viewable" ON public.profile_badges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_badges.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
-- Badges are usually system-awarded, but for now let's allow users to read. 
-- Writing badges should be restricted to system/admin functions or triggers?
-- For simplicity in this MVP, we'll allow users to insert (maybe via API logic) or just admin.
-- Let's stick to: Users can READ. System (service role) writes.
-- But wait, if we run logic in Edge Functions, they use service role.
-- If we run logic in Next.js API routes, we can use service role.
-- So we don't need user write policies for badges if they are auto-awarded.
-- However, for manual testing, let's allow users to manage for now, or admins.
CREATE POLICY "Admins manage badges" ON public.profile_badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Coding Stats
CREATE POLICY "Public stats viewable" ON public.coding_stats_unified
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = coding_stats_unified.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
-- Stats are system updated.

-- Timeline
CREATE POLICY "Public timeline viewable" ON public.activity_timeline
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = activity_timeline.user_id AND visibility = 'public')
    OR auth.uid() = user_id
  );
-- Timeline is system updated.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_profile_integrations_user ON public.profile_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_stats_xp ON public.coding_stats_unified(total_xp DESC);
