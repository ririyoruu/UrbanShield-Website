-- Migration 001: Add status fields to incidents table
-- This migration adds the new status flow fields to support the moderation workflow

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'status'
  ) THEN
    ALTER TABLE incidents ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE incidents ADD CONSTRAINT check_status 
      CHECK (status IN ('pending', 'in_action', 'resolved', 'duplicate'));
    
    -- Update existing records based on is_verified field
    UPDATE incidents 
    SET status = CASE 
      WHEN is_verified = true THEN 'resolved'
      WHEN is_verified = false THEN 'pending'
      ELSE 'pending'
    END;
  END IF;
END $$;

-- Add admin-related fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE incidents ADD COLUMN admin_notes TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'proof_url'
  ) THEN
    ALTER TABLE incidents ADD COLUMN proof_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE incidents ADD COLUMN resolved_by UUID REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'assigned_responder_id'
  ) THEN
    ALTER TABLE incidents ADD COLUMN assigned_responder_id UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Add indexes for new status column
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_at ON incidents(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_by ON incidents(resolved_by);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_responder ON incidents(assigned_responder_id);

-- Update existing resolved incidents to have resolved_at timestamp
UPDATE incidents 
SET resolved_at = updated_at, resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;
