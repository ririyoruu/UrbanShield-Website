-- Migration 006: Standardize incident statuses
-- Renames 'pending' -> 'open' and 'in_action' -> 'in_progress'

-- First, drop the old constraint
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS check_status;

-- Update existing data
UPDATE incidents SET status = 'open' WHERE status = 'pending';
UPDATE incidents SET status = 'in_progress' WHERE status = 'in_action';

-- Update default value
ALTER TABLE incidents ALTER COLUMN status SET DEFAULT 'open';

-- Add new constraint
ALTER TABLE incidents ADD CONSTRAINT check_status 
  CHECK (status IN ('open', 'in_progress', 'resolved', 'duplicate'));

-- Also update notifications table types if they match
UPDATE notifications SET type = 'in_progress' WHERE type = 'in_action';
