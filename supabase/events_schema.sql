-- Events System Schema
-- WARNING: This script drops existing event tables to ensure a clean state.

-- 0. Cleanup
DROP TABLE IF EXISTS public.event_analytics CASCADE;
DROP TABLE IF EXISTS public.event_form_responses CASCADE;
DROP TABLE IF EXISTS public.event_forms CASCADE;
DROP TABLE IF EXISTS public.event_categories CASCADE;
DROP TABLE IF EXISTS public.event_reactions CASCADE;
DROP TABLE IF EXISTS public.event_comments CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.email_queue CASCADE;

-- 1. Events Table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_ts timestamptz NOT NULL,
  end_ts timestamptz,
  location text,
  capacity int, -- null means unlimited
  image_path text, -- Supabase storage path
  color_block text, -- fallback hex color
  tags text[] DEFAULT '{}',
  category text,
  created_by uuid REFERENCES auth.users(id),
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  participants_count int DEFAULT 0
);

-- 2. Event Registrations
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 3. Event Comments
CREATE TABLE public.event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.event_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Event Reactions
CREATE TABLE public.event_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id, reaction)
);

-- 5. Event Categories
CREATE TABLE public.event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 6. Event Forms
CREATE TABLE public.event_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  schema jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 7. Event Form Responses
CREATE TABLE public.event_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.event_forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  response jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

-- 8. Event Analytics
CREATE TABLE public.event_analytics (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  views bigint DEFAULT 0,
  registrations bigint DEFAULT 0,
  participants bigint DEFAULT 0
);

-- 9. Email Queue
CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body_html text,
  body_text text,
  attachments jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_start_ts ON public.events(start_ts);
CREATE INDEX idx_event_registrations_event_user ON public.event_registrations(event_id, user_id);
CREATE INDEX idx_event_comments_event_created ON public.event_comments(event_id, created_at);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Events Policies
CREATE POLICY "Public read access" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Registrations Policies
CREATE POLICY "Users can read registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage registrations" ON public.event_registrations FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Comments Policies
CREATE POLICY "Public read comments" ON public.event_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.event_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit own comments" ON public.event_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.event_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON public.event_comments FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Reactions Policies
CREATE POLICY "Public read reactions" ON public.event_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON public.event_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unreact" ON public.event_reactions FOR DELETE USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Public read categories" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.event_categories FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Forms Policies
CREATE POLICY "Public read forms" ON public.event_forms FOR SELECT USING (true);
CREATE POLICY "Admins manage forms" ON public.event_forms FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Form Responses Policies
CREATE POLICY "Users can read own responses" ON public.event_form_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit responses" ON public.event_form_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage responses" ON public.event_form_responses FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Analytics Policies
CREATE POLICY "Admins read analytics" ON public.event_analytics FOR SELECT USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- Email Queue Policies
CREATE POLICY "Admins manage email queue" ON public.email_queue FOR ALL USING (
  exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
);

-- RPC Function for Atomic Registration
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity int;
  v_count int;
  v_registration_id uuid;
BEGIN
  -- Lock event row
  SELECT capacity, participants_count INTO v_capacity, v_count
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Check capacity
  IF v_capacity IS NOT NULL AND v_count >= v_capacity THEN
    RAISE EXCEPTION 'Event is full';
  END IF;

  -- Check existing registration
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = p_event_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Already registered';
  END IF;

  -- Insert registration
  INSERT INTO public.event_registrations (event_id, user_id)
  VALUES (p_event_id, p_user_id)
  RETURNING id INTO v_registration_id;

  -- Update count
  UPDATE public.events
  SET participants_count = participants_count + 1
  WHERE id = p_event_id;

  -- Update analytics (upsert)
  INSERT INTO public.event_analytics (event_id, registrations)
  VALUES (p_event_id, 1)
  ON CONFLICT (event_id) DO UPDATE
  SET registrations = event_analytics.registrations + 1;

  RETURN jsonb_build_object('success', true, 'registration_id', v_registration_id);
END;
$$;
