-- Final Setup - Your table already has moderation columns
-- Just add missing ENUM values and update data

-- 1. Add missing ENUM values
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'in_action';  
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'duplicate';

-- 2. Update existing data - convert 'open' to 'pending'
UPDATE incidents 
SET status = CASE 
  WHEN status = 'open' THEN 'pending'::incident_status
  ELSE status
END;

-- 3. Update resolved incidents with metadata
UPDATE incidents 
SET resolved_at = updated_at, resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;

-- 4. Show final results
SELECT 
  status,
  COUNT(*) as count
FROM incidents 
GROUP BY status 
ORDER BY count DESC;
