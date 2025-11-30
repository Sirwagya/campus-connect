-- Create the storage bucket for event banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled (it usually is)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view event banners
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-banners' );

-- Policy: Admins can upload event banners
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- Policy: Admins can update event banners
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-banners' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- Policy: Admins can delete event banners
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-banners' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);
