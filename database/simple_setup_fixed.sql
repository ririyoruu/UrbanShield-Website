-- Simple Setup - Fixed logic for fake reports

-- 1. Add new ENUM values to incident_status
ALTER TYPE incident_status ADD VALUE 'pending';
ALTER TYPE incident_status ADD VALUE 'in_action';  
ALTER TYPE incident_status ADD VALUE 'resolved';
ALTER TYPE incident_status ADD VALUE 'duplicate';

-- 2. Update existing incidents based on is_verified field
UPDATE incidents 
SET status = CASE 
  WHEN is_verified = true THEN 'resolved'  -- Verified reports are resolved
  WHEN is_verified = false THEN 'pending'  -- Fake reports stay pending (for admin review)
  ELSE 'pending'  -- Unverified reports are pending
END;

-- 3. Add missing columns
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_responder_id UUID REFERENCES profiles(id);

-- 4. Update resolved incidents
UPDATE incidents 
SET resolved_at = updated_at, resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;

-- 5. Show results
SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status = 'resolved' THEN 'Previously verified reports'
    WHEN status = 'pending' THEN 'Unverified or fake reports (need review)'
    ELSE status
  END as description
FROM incidents 
GROUP BY status 
ORDER BY count DESC;
