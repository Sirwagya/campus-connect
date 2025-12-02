-- Setup Space Assets Storage Bucket
-- Run this in Supabase SQL Editor to create the storage bucket and policies

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-assets',
  'space-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Policy: Anyone can view space assets (public bucket)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'space-assets' );

-- Policy: Authenticated users can upload assets
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'space-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update their uploads
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'space-assets' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete their uploads
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'space-assets' 
  AND auth.role() = 'authenticated'
);
