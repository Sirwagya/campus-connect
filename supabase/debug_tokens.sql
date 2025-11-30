-- Check if tokens are stored
SELECT 
  id,
  email,
  SUBSTRING(google_access_token, 1, 30) as token_preview,
  google_refresh_token IS NOT NULL as has_refresh_token,
  token_expiry,
  CASE 
    WHEN token_expiry > EXTRACT(EPOCH FROM NOW()) * 1000 THEN 'Valid'
    ELSE 'Expired'
  END as token_status
FROM users
WHERE email = 'sirwagya.shekhar2029@vedamsot.org';
