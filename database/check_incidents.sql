-- Simple query to check incidents table values
SELECT 
  id,
  title,
  status,
  is_verified,
  category,
  severity,
  reporter_id,
  created_at,
  updated_at
FROM incidents 
ORDER BY created_at DESC;
