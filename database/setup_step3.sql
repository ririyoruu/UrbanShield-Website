-- Step 3: Remove is_verified column (run after Step 2)

-- Remove the is_verified column completely
ALTER TABLE incidents DROP COLUMN IF EXISTS is_verified;

-- Show final results
SELECT 
  'Setup Complete' as status,
  COUNT(*) as total_incidents,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'in_action' THEN 1 END) as in_action,
  COUNT(CASE WHEN status = 'duplicate' THEN 1 END) as duplicate
FROM incidents;
