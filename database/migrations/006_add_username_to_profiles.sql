-- Migration 006: Add username field to profiles table
-- This migration adds a username column for responders and other users

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username VARCHAR(50) UNIQUE;
  END IF;
END $$;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment for documentation
COMMENT ON COLUMN profiles.username IS 'Unique username for the user, used for login and display';
