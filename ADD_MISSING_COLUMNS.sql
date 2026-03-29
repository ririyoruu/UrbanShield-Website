-- ============================================
-- ADD ALL MISSING COLUMNS TO INCIDENTS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Based on scanning all adminService methods, these columns are used but may be missing:

-- 1. Basic status tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Admin notes
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Responder assignment
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_officer TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES profiles(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 4. Status tracking metadata
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES profiles(id);

-- 5. Resolution tracking
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- ============================================
-- VERIFY ALL COLUMNS EXIST
-- Run this to check what columns you have:
-- ============================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'incidents'
ORDER BY ordinal_position;

-- ============================================
-- EXPECTED COLUMNS IN INCIDENTS TABLE:
-- ============================================
-- Core fields (should already exist):
-- - id (UUID, primary key)
-- - reporter_id (UUID, references profiles)
-- - title (TEXT)
-- - description (TEXT)
-- - category (TEXT)
-- - severity (TEXT)
-- - location (GEOGRAPHY or TEXT)
-- - created_at (TIMESTAMPTZ)

-- Fields added by this script:
-- - status (TEXT) - 'pending', 'in_action', 'resolved', 'duplicate'
-- - updated_at (TIMESTAMPTZ) - last update timestamp
-- - admin_notes (TEXT) - admin's internal notes
-- - assigned_officer (TEXT) - name of assigned responder
-- - assigned_officer_id (UUID) - ID of assigned responder
-- - assigned_at (TIMESTAMPTZ) - when responder was assigned
-- - status_updated_at (TIMESTAMPTZ) - when status last changed
-- - status_updated_by (UUID) - who changed the status
-- - resolved_at (TIMESTAMPTZ) - when incident was resolved
-- - proof_url (TEXT) - URL to proof of resolution image
