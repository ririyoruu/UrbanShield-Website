-- Step 2: Update status and add columns (run after Step 1)

-- 1. Update status based on is_verified values
UPDATE incidents 
SET status = CASE 
  WHEN is_verified = true THEN 'resolved'::incident_status
  WHEN is_verified = false THEN 'pending'::incident_status
  WHEN status = 'open' THEN 'pending'::incident_status
  ELSE status
END;

-- 2. Add missing columns for moderation workflow
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_responder_id UUID REFERENCES profiles(id);

-- 3. Update resolved incidents
UPDATE incidents 
SET resolved_at = updated_at, resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;

-- 4. Show results (fixed - removed text descriptions from CASE)
SELECT 
  status,
  COUNT(*) as count
FROM incidents 
GROUP BY status 
ORDER BY count DESC;
