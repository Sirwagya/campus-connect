-- Check if email bodies are being stored
SELECT 
  id,
  subject,
  SUBSTRING(body_text, 1, 50) as text_preview,
  SUBSTRING(body_html, 1, 50) as html_preview,
  LENGTH(body_text) as text_length,
  LENGTH(body_html) as html_length,
  to_email
FROM alerts
ORDER BY received_at DESC
LIMIT 5;
