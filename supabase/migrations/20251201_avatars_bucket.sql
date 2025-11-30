-- Create the storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view avatars
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload avatars
-- We'll allow any authenticated user to upload to the avatars bucket.
-- Ideally, we'd restrict paths, but for MVP this is fine.
CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own avatars (based on owner_id which is set to auth.uid() by default on upload)
CREATE POLICY "Users Update Own Avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users Delete Own Avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);
