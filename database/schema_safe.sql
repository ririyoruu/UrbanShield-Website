-- Incident Moderation Database Schema (Safe Version)
-- Supabase PostgreSQL Schema
-- This version uses CREATE OR REPLACE and IF NOT EXISTS to avoid conflicts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (user management)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'government', 'responder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table (main incident reports)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  coordinates TEXT, -- PostGIS WKB hex string
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_action', 'resolved', 'duplicate')),
  is_verified BOOLEAN DEFAULT NULL, -- Legacy field, kept for backward compatibility
  reporter_id UUID REFERENCES profiles(id),
  assigned_responder_id UUID REFERENCES profiles(id),
  admin_notes TEXT,
  proof_url TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident images table
CREATE TABLE IF NOT EXISTS incident_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Duplicate detection cache (optional, for performance)
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  duplicate_of_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2),
  detection_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS incident_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'start_action', 'resolved', 'flagged_duplicate'
  performed_by UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id ON incident_images(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_incident_id ON incident_activity_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_created_at ON incident_activity_log(created_at DESC);

-- PostGIS extension for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add status column if it doesn't exist (for existing databases)
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

-- Add other missing columns if they don't exist
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

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Users can create incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can update incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON incidents;
DROP POLICY IF EXISTS "Users can view images of own incidents" ON incident_images;
DROP POLICY IF EXISTS "Admins can view all incident images" ON incident_images;
DROP POLICY IF EXISTS "Users can upload images to own incidents" ON incident_images;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON incident_activity_log;
DROP POLICY IF EXISTS "Users can view activity of own incidents" ON incident_activity_log;
DROP POLICY IF EXISTS "Admins can view all duplicate candidates" ON duplicate_candidates;
DROP POLICY IF EXISTS "Admins can manage duplicate candidates" ON duplicate_candidates;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

-- Incidents RLS policies
CREATE POLICY "Users can view own incidents" ON incidents
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all incidents" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Users can create incidents" ON incidents
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update incidents" ON incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Admins can delete incidents" ON incidents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

-- Incident images RLS policies
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
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
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

-- Activity log RLS policies
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
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

-- Duplicate candidates RLS policies
CREATE POLICY "Admins can view all duplicate candidates" ON duplicate_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

CREATE POLICY "Admins can manage duplicate candidates" ON duplicate_candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'government', 'responder')
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log incident activity
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

-- Drop existing activity trigger if it exists
DROP TRIGGER IF EXISTS incident_activity_trigger ON incidents;

-- Trigger for activity logging
CREATE TRIGGER incident_activity_trigger
  AFTER INSERT OR UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION log_incident_activity();

-- Function to find potential duplicates
CREATE OR REPLACE FUNCTION find_duplicate_incidents(
  p_title TEXT,
  p_description TEXT,
  p_category VARCHAR(100),
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_created_at TIMESTAMP WITH TIME ZONE,
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  incident_id UUID,
  similarity_score DECIMAL(3,2),
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    -- Calculate similarity score (0.00 to 1.00)
    CASE
      WHEN 
        -- Title similarity (40% weight)
        (CASE WHEN LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%' THEN 0.4 ELSE 0 END) +
        -- Category match (30% weight)
        (CASE WHEN i.category = p_category THEN 0.3 ELSE 0 END) +
        -- Location proximity (20% weight)
        (CASE WHEN 
          i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND
          ABS(i.latitude - p_latitude) < 0.01 AND 
          ABS(i.longitude - p_longitude) < 0.01 
          THEN 0.2 ELSE 0 END) +
        -- Time proximity (10% weight)
        (CASE WHEN 
          ABS(EXTRACT(EPOCH FROM (i.created_at - p_created_at)) / 3600) <= p_time_window_hours
          THEN 0.1 ELSE 0 END) > 0.6
      THEN 
        (CASE WHEN LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%' THEN 0.4 ELSE 0 END) +
        (CASE WHEN i.category = p_category THEN 0.3 ELSE 0 END) +
        (CASE WHEN i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND ABS(i.latitude - p_latitude) < 0.01 AND ABS(i.longitude - p_longitude) < 0.01 THEN 0.2 ELSE 0 END) +
        (CASE WHEN ABS(EXTRACT(EPOCH FROM (i.created_at - p_created_at)) / 3600) <= p_time_window_hours THEN 0.1 ELSE 0 END)
      ELSE 0
    END as similarity_score,
    CASE
      WHEN LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%' 
        AND i.category = p_category THEN 'Title and Category Match'
      WHEN LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%' 
        THEN 'Title Match'
      WHEN i.category = p_category 
        AND i.latitude IS NOT NULL AND i.longitude IS NOT NULL 
        AND ABS(i.latitude - p_latitude) < 0.01 AND ABS(i.longitude - p_longitude) < 0.01 
        THEN 'Category and Location Match'
      WHEN i.latitude IS NOT NULL AND i.longitude IS NOT NULL 
        AND ABS(i.latitude - p_latitude) < 0.01 AND ABS(i.longitude - p_longitude) < 0.01 
        THEN 'Location Match'
      ELSE 'Time Proximity'
    END as match_reason
  FROM incidents i
  WHERE 
    i.id IS NOT NULL
    AND i.status != 'duplicate'
    AND (
      -- Title similarity
      LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' 
      OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%'
      -- Category match
      OR i.category = p_category
      -- Location proximity
      OR (i.latitude IS NOT NULL AND i.longitude IS NOT NULL 
          AND ABS(i.latitude - p_latitude) < 0.01 
          AND ABS(i.longitude - p_longitude) < 0.01)
      -- Time proximity
      OR ABS(EXTRACT(EPOCH FROM (i.created_at - p_created_at)) / 3600) <= p_time_window_hours
    )
    AND (
      -- Calculate similarity score and filter
      (CASE WHEN LOWER(p_title) LIKE '%' || LOWER(i.title) || '%' OR LOWER(i.title) LIKE '%' || LOWER(p_title) || '%' THEN 0.4 ELSE 0 END) +
      (CASE WHEN i.category = p_category THEN 0.3 ELSE 0 END) +
      (CASE WHEN i.latitude IS NOT NULL AND i.longitude IS NOT NULL AND ABS(i.latitude - p_latitude) < 0.01 AND ABS(i.longitude - p_longitude) < 0.01 THEN 0.2 ELSE 0 END) +
      (CASE WHEN ABS(EXTRACT(EPOCH FROM (i.created_at - p_created_at)) / 3600) <= p_time_window_hours THEN 0.1 ELSE 0 END)
    ) > 0.6
  ORDER BY similarity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically detect duplicates on insert
CREATE OR REPLACE FUNCTION detect_duplicates_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_record RECORD;
BEGIN
  -- Only check for duplicates if the incident is not already marked as duplicate
  IF NEW.status != 'duplicate' THEN
    FOR duplicate_record IN 
      SELECT * FROM find_duplicate_incidents(
        NEW.title, 
        NEW.description, 
        NEW.category, 
        NEW.latitude, 
        NEW.longitude, 
        NEW.created_at
      )
    LOOP
      -- Insert into duplicate candidates table
      INSERT INTO duplicate_candidates (incident_id, duplicate_of_id, similarity_score, detection_method, created_at)
      VALUES (
        NEW.id,
        duplicate_record.incident_id,
        duplicate_record.similarity_score,
        duplicate_record.match_reason,
        NOW()
      )
      ON CONFLICT (incident_id, duplicate_of_id) DO NOTHING;
      
      -- If similarity is very high (>0.8), automatically mark as duplicate
      IF duplicate_record.similarity_score > 0.8 THEN
        UPDATE incidents 
        SET status = 'duplicate', updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Log the duplicate detection
        INSERT INTO incident_activity_log (incident_id, action, performed_by, details)
        VALUES (
          NEW.id,
          'flagged_duplicate',
          NULL, -- System action
          jsonb_build_object(
            'duplicate_of', duplicate_record.incident_id,
            'similarity_score', duplicate_record.similarity_score,
            'match_reason', duplicate_record.match_reason
          )
        );
        
        -- Exit early since we marked it as duplicate
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing duplicate detection trigger if it exists
DROP TRIGGER IF EXISTS detect_duplicates_trigger ON incidents;

-- Create trigger for automatic duplicate detection
CREATE TRIGGER detect_duplicates_trigger
  AFTER INSERT ON incidents
  FOR EACH ROW EXECUTE FUNCTION detect_duplicates_on_insert();

-- Sample data for testing
INSERT INTO profiles (id, email, full_name, role) VALUES
  (uuid_generate_v4(), 'admin@example.com', 'Admin User', 'admin'),
  (uuid_generate_v4(), 'responder@example.com', 'Responder User', 'responder'),
  (uuid_generate_v4(), 'user@example.com', 'Regular User', 'user')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON incidents TO authenticated;
GRANT ALL ON incident_images TO authenticated;
GRANT ALL ON duplicate_candidates TO authenticated;
GRANT ALL ON incident_activity_log TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON profiles TO service_role;
GRANT ALL ON incidents TO service_role;
GRANT ALL ON incident_images TO service_role;
GRANT ALL ON duplicate_candidates TO service_role;
GRANT ALL ON incident_activity_log TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION find_duplicate_incidents TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_incidents TO service_role;
