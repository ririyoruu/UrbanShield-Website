-- Migration 002: Add activity log table for audit trail
-- This migration creates the incident_activity_log table for tracking all actions

-- Create activity log table
CREATE TABLE IF NOT EXISTS incident_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'start_action', 'resolved', 'flagged_duplicate', 'status_change')),
  performed_by UUID REFERENCES profiles(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_incident_id ON incident_activity_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_created_at ON incident_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_action ON incident_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_incident_activity_log_performed_by ON incident_activity_log(performed_by);

-- Enable RLS
ALTER TABLE incident_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
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

-- Grant permissions
GRANT ALL ON incident_activity_log TO authenticated;
GRANT ALL ON incident_activity_log TO service_role;
