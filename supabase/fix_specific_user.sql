-- Fix the specific user ID we saw in the screenshot
-- ID: 8de583fb-b8b6-4928-ada8-9b4106efb01f

UPDATE public.users
SET 
  full_name = 'Sirwagya Shekhar',
  name = 'Sirwagya Shekhar',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sirwagya'
WHERE id = '8de583fb-b8b6-4928-ada8-9b4106efb01f';

-- Also verify the update returned something
SELECT * FROM public.users WHERE id = '8de583fb-b8b6-4928-ada8-9b4106efb01f';
