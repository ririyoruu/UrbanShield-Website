-- Remove is_verified field and use only status field
-- Works with: open, in_progress, resolved, closed, pending, in_action, duplicate

-- 1. Add missing ENUM values if needed
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'in_action';  
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'duplicate';

-- 2. Update status based on is_verified values before removing the column
UPDATE incidents 
SET status = CASE 
  WHEN is_verified = true THEN 'resolved'::incident_status
  WHEN is_verified = false THEN 'pending'::incident_status
  WHEN status = 'open' THEN 'pending'::incident_status
  ELSE status
END;

-- 3. Add missing columns for moderation workflow
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_responder_id UUID REFERENCES profiles(id);

-- 4. Update resolved incidents
UPDATE incidents 
SET resolved_at = updated_at, resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;

-- 5. Remove the is_verified column completely
ALTER TABLE incidents DROP COLUMN IF EXISTS is_verified;

-- 6. Show results
SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status = 'resolved' THEN 'Admin verified (legitimate)'
    WHEN status = 'pending' THEN 'User-flagged or new (need admin review)'
    WHEN status = 'in_action' THEN 'Currently being handled'
    WHEN status = 'duplicate' THEN 'Duplicate report'
    ELSE status
  END as description
FROM incidents 
GROUP BY status 
ORDER BY count DESC;
