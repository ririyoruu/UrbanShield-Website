const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditLogTable() {
  try {
    console.log('🔍 Checking for audit_logs table...');
    
    // Try to fetch from audit_logs table
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing audit_logs table:', error);
      console.log('💡 Table likely does not exist. Creating schema...');
      
      console.log('📝 SQL to create audit_logs table:');
      console.log(`
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'incident', 'announcement', 'system'
  target_id UUID, -- ID of the target record
  target_name TEXT, -- Human-readable name of target
  action_type TEXT NOT NULL CHECK (action_type IN ('verification', 'moderation', 'settings', 'user_management', 'announcement', 'incident_management')),
  details JSONB, -- Additional details about the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Create policy for system to insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create policy for admins to insert audit logs
CREATE POLICY "Admins can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );
      `);
    } else {
      console.log('✅ audit_logs table exists. Sample data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAuditLogTable();
