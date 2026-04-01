-- Migration 005: Align announcements table with frontend schema
-- This migration adds/modifies columns to match the AnnouncementsManagement component

-- Add new columns for the alert system (if they don't exist)
DO $$
BEGIN
  -- Alert level (critical, warning, info, notice)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'alert_level'
  ) THEN
    ALTER TABLE announcements ADD COLUMN alert_level VARCHAR(20) DEFAULT 'info';
  END IF;

  -- Alert type/tag (e.g., Typhoon Warning, Health Advisory)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'alert_type'
  ) THEN
    ALTER TABLE announcements ADD COLUMN alert_type VARCHAR(100);
  END IF;

  -- Areas affected (e.g., Barangay Tubigon, Bohol)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'areas'
  ) THEN
    ALTER TABLE announcements ADD COLUMN areas TEXT;
  END IF;

  -- Action items (array of steps to take)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'action_items'
  ) THEN
    ALTER TABLE announcements ADD COLUMN action_items TEXT[];
  END IF;
END $$;

-- Migrate existing data if priority column exists (backward compatibility)
DO $$
BEGIN
  -- Map priority to alert_level if priority exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'priority'
  ) THEN
    UPDATE announcements 
    SET alert_level = CASE priority
      WHEN 'urgent' THEN 'critical'
      WHEN 'high' THEN 'warning'
      WHEN 'normal' THEN 'info'
      WHEN 'low' THEN 'notice'
      ELSE 'info'
    END
    WHERE alert_level IS NULL OR alert_level = 'info';
  END IF;

  -- Copy target_audience to alert_type if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'announcements' AND column_name = 'target_audience'
  ) THEN
    UPDATE announcements 
    SET alert_type = target_audience
    WHERE (alert_type IS NULL OR alert_type = '') AND target_audience IS NOT NULL;
  END IF;
END $$;

-- Add constraint for valid alert levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'announcements' AND constraint_name = 'check_alert_level'
  ) THEN
    ALTER TABLE announcements 
    ADD CONSTRAINT check_alert_level 
    CHECK (alert_level IN ('critical', 'warning', 'info', 'notice'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_alert_level ON announcements(alert_level);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned) WHERE is_pinned = true;

-- Enable RLS on announcements table if not already enabled
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admin full access to announcements" ON announcements;
DROP POLICY IF EXISTS "Allow authenticated users to read announcements" ON announcements;

-- Create policy for public read access (for external apps)
CREATE POLICY "Allow public read access to announcements"
  ON announcements
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for admin write access
CREATE POLICY "Allow admin full access to announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type IN ('admin', 'super_admin')
    )
  );

-- Add comment for API documentation
COMMENT ON TABLE announcements IS 'Public announcements/alerts for the UrbanShield platform. Accessible via API for external applications.';
