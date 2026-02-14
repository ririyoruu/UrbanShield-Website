-- Migration 003: Add duplicate detection functionality
-- This migration adds tables and functions for automatic duplicate detection

-- Create duplicate candidates table
CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  duplicate_of_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  detection_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(incident_id, duplicate_of_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_incident_id ON duplicate_candidates(incident_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_duplicate_of_id ON duplicate_candidates(duplicate_of_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_candidates_similarity ON duplicate_candidates(similarity_score DESC);

-- Enable RLS
ALTER TABLE duplicate_candidates ENABLE ROW LEVEL SECURITY;

-- RLS policies
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

-- Grant permissions
GRANT ALL ON duplicate_candidates TO authenticated;
GRANT ALL ON duplicate_candidates TO service_role;

-- Create the duplicate detection function
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

-- Create trigger function to automatically detect duplicates
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

-- Create trigger for automatic duplicate detection
CREATE TRIGGER detect_duplicates_trigger
  AFTER INSERT ON incidents
  FOR EACH ROW EXECUTE FUNCTION detect_duplicates_on_insert();

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION find_duplicate_incidents TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_incidents TO service_role;
