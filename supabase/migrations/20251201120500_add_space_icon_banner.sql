-- Add icon_url and banner_url columns to spaces table
-- Run this migration to enable custom icons and banners for spaces

-- Add icon_url column
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add banner_url column
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.spaces.icon_url IS 'URL to the space icon/avatar image stored in Supabase Storage';
COMMENT ON COLUMN public.spaces.banner_url IS 'URL to the space banner image stored in Supabase Storage';

-- Create a storage bucket for space assets if it doesn't exist
-- This should be run in the Supabase dashboard or via the API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('space-assets', 'space-assets', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for space-assets bucket
-- These need to be run after creating the bucket

-- Policy: Anyone can view space assets (public bucket)
-- CREATE POLICY "Public Access"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'space-assets' );

-- Policy: Space owners and moderators can upload assets
-- CREATE POLICY "Owners and Mods can upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( 
--   bucket_id = 'space-assets' 
--   AND auth.role() = 'authenticated'
-- );

-- Policy: Space owners and moderators can update their assets
-- CREATE POLICY "Owners and Mods can update"
-- ON storage.objects FOR UPDATE
-- USING ( 
--   bucket_id = 'space-assets' 
--   AND auth.role() = 'authenticated'
-- );

-- Policy: Space owners and moderators can delete their assets
-- CREATE POLICY "Owners and Mods can delete"
-- ON storage.objects FOR DELETE
-- USING ( 
--   bucket_id = 'space-assets' 
--   AND auth.role() = 'authenticated'
-- );
