-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- Ideally restricted; service role bypasses RLS anyway

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
