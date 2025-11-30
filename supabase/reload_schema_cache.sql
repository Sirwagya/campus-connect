-- Force Supabase (PostgREST) to reload its schema cache
-- Run this after making changes to tables (like adding columns) if the API doesn't see them yet.

NOTIFY pgrst, 'reload config';
