-- Fix the profile for the current user
-- Replace the email with your actual email if different

UPDATE public.users
SET 
  full_name = 'Sirwagya Shekhar',
  name = 'Sirwagya Shekhar',
  -- We'll use a generic avatar if we don't have the Google one handy. 
  -- You can replace this with your actual Google avatar URL if you have it.
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sirwagya' 
WHERE email = 'sirwagyashekhar2029@vedamsot.org';
