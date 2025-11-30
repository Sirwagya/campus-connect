SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';

SELECT * FROM public.users WHERE name = 'sirwagya.shekhar2029' OR email LIKE 'sirwagya.shekhar2029%';
