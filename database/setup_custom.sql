-- Custom Setup for Your Existing Database
-- Works with your current profiles and incidents structure

-- 1. Add missing columns to incidents table (only if they don't exist)
DO $$
BEGIN
  -- Add status column (you have 'status' but it's 'open', need to change to new workflow)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'status'
  ) THEN
    -- Update existing 'open' status to 'pending' for new workflow
    UPDATE incidents 
    SET status = 'pending' 
    WHERE status = 'open';
    
    -- Add constraint for new status values
    ALTER TABLE incidents DROP CONSTRAINT IF EXISTS check_status;
    ALTER TABLE incidents ADD CONSTRAINT check_status 
      CHECK (status IN ('pending', 'in_action', 'resolved', 'duplicate'));
    
    RAISE NOTICE 'Updated existing status column from open to pending workflow';
  ELSE
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
    
    RAISE NOTICE 'Added new status column to incidents table';
  END IF;
  
  -- Add admin_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE incidents ADD COLUMN admin_notes TEXT;
    RAISE NOTICE 'Added admin_notes column to incidents table';
  END IF;
  
  -- Add proof_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'proof_url'
  ) THEN
    ALTER TABLE incidents ADD COLUMN proof_url TEXT;
    RAISE NOTICE 'Added proof_url column to incidents table';
  END IF;
  
  -- Add resolved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added resolved_at column to incidents table';
  END IF;
  
  -- Add resolved_by column (references your profiles table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE incidents ADD COLUMN resolved_by UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added resolved_by column to incidents table';
  END IF;
  
  -- Add assigned_responder_id column (references your profiles table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'assigned_responder_id'
  ) THEN
    ALTER TABLE incidents ADD COLUMN assigned_responder_id UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added assigned_responder_id column to incidents table';
  END IF;
END $$;

-- 2. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS incident_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'start_action', 'resolved', 'flagged_duplicate')),
  performed_by UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  duplicate_of_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  detection_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(incident_id, duplicate_of_id)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id ON incident_images(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_incident_id ON incident_activity_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_created_at ON incident_activity_log(created_at DESC);

-- 4. Enable Row Level Security on new tables
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for new tables (based on your user_type field)
CREATE POLICY "Users can view images of own incidents" ON incident_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_images.incident_id 
      AND incidents.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all incident images" ON incident_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Users can upload images to own incidents" ON incident_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_images.incident_id 
      AND incidents.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Users can view activity of own incidents" ON incident_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_activity_log.incident_id 
      AND incidents.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all activity logs" ON incident_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Admins can view all duplicate candidates" ON duplicate_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Admins can manage duplicate candidates" ON duplicate_candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'government', 'responder')
    )
  );

-- 6. Create functions for the moderation workflow
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_incidents_updated_at' 
    AND event_object_table = 'incidents'
  ) THEN
    CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. Create activity logging function
CREATE OR REPLACE FUNCTION log_incident_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO incident_activity_log (incident_id, action, performed_by, details)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'in_action' THEN 'start_action'
        WHEN 'resolved' THEN 'resolved'
        WHEN 'duplicate' THEN 'flagged_duplicate'
        ELSE 'status_change'
      END,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'admin_notes', NEW.admin_notes,
        'proof_url', NEW.proof_url
      )
    );
  END IF;
  
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO incident_activity_log (incident_id, action, performed_by, details)
    VALUES (
      NEW.id,
      'created',
      NEW.reporter_id,
      jsonb_build_object(
        'title', NEW.title,
        'category', NEW.category,
        'severity', NEW.severity
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create activity logging trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'incident_activity_trigger' 
    AND event_object_table = 'incidents'
  ) THEN
    CREATE TRIGGER incident_activity_trigger
      AFTER INSERT OR UPDATE ON incidents
      FOR EACH ROW EXECUTE FUNCTION log_incident_activity();
  END IF;
END $$;

-- 8. Grant permissions
GRANT ALL ON incident_images TO authenticated;
GRANT ALL ON incident_images TO service_role;
GRANT ALL ON incident_activity_log TO authenticated;
GRANT ALL ON incident_activity_log TO service_role;
GRANT ALL ON duplicate_candidates TO authenticated;
GRANT ALL ON duplicate_candidates TO service_role;

-- 9. Update existing resolved incidents
UPDATE incidents 
SET 
  resolved_at = updated_at,
  resolved_by = reporter_id
WHERE status = 'resolved' AND resolved_at IS NULL;

-- 10. Update your Supabase service to work with your schema
-- Note: Your frontend will need to handle these field mappings:
-- - user_type instead of role (admin, resident, etc.)
-- - images array instead of separate table (for existing data)
-- - is_verified field still exists for backward compatibility

RAISE NOTICE '=== Custom Setup Complete ===';
RAISE NOTICE 'Your database is now ready for the incident moderation workflow!';
RAISE NOTICE 'Note: Your existing incidents with status="open" are now "pending"';
RAISE NOTICE 'Admin users are those with user_type="admin" in profiles table';
