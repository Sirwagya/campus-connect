SELECT 
  id, 
  subject, 
  LENGTH(body_html) as html_len, 
  LENGTH(body_text) as text_len,
  SUBSTRING(body_html, 1, 100) as html_start,
  SUBSTRING(body_text, 1, 100) as text_start
FROM alerts 
WHERE subject LIKE '%Attendance Requirement%'
LIMIT 1;
