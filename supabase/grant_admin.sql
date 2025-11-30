-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN 
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE; 
    END IF; 
END $$;

-- Grant admin to specific user (try matching by name or email pattern)
UPDATE public.users 
SET is_admin = TRUE 
WHERE name = 'sirwagya.shekhar2029' 
   OR email LIKE 'sirwagya.shekhar2029%'
   OR full_name LIKE '%Sirwagya Shekhar%';

-- Verify
SELECT id, name, email, is_admin FROM public.users WHERE is_admin = TRUE;
