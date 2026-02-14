-- Step 1: Add missing ENUM values
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'in_action';  
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'duplicate';
