-- Migration: Add 'responder' to user_type enum
-- Date: 2026-03-30
-- Description: Adds 'responder' as a valid user_type in the profiles table

-- Drop the existing constraint if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add the new constraint with only 3 user types: admin, responder, resident
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('admin', 'responder', 'resident'));

-- Update verification_status constraint to include all statuses
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_verification_status_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_verification_status_check
CHECK (verification_status IN ('pending', 'verified', 'approved', 'rejected', 'suspended'));

-- Add department column if it doesn't exist (for responders)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE profiles ADD COLUMN department VARCHAR(100);
    END IF;
END $$;

-- Add phone column if it doesn't exist (alternative to phone_number)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Create index on user_type for faster responder queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Create index on verification_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- Add comment
COMMENT ON COLUMN profiles.user_type IS 'User role: admin, responder, resident';
COMMENT ON COLUMN profiles.department IS 'Department name for responders (e.g., Fire Department, Police, Medical)';
