SELECT 
  id, 
  email, 
  google_access_token IS NOT NULL as has_access_token,
  google_refresh_token IS NOT NULL as has_refresh_token,
  token_expiry
FROM users 
WHERE email = 'urvashi.pali2029@vedamsot.org';
