-- Migration: Add Super Admin role and permissions system
-- Date: 2026-03-31
-- Description: Adds 'super_admin' user type and creates permissions/audit system

-- ============================================
-- 1. Update user_type to include super_admin
-- ============================================
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('super_admin', 'admin', 'responder', 'resident'));

-- Add role column for more granular permissions (optional, for future expansion)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT NULL;
    END IF;
END $$;

-- ============================================
-- 2. Create system_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'branding', 'notifications', 'categories', 'general'
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
('app_name', '"UrbanShield"', 'branding', 'Application name'),
('app_logo_url', 'null', 'branding', 'Application logo URL'),
('primary_color', '"#3b82f6"', 'branding', 'Primary brand color'),
('responder_categories', '["BFP - Fire Protection", "PNP - Police", "MDRRMO - Disaster Response", "RHU - Health Unit", "BHW - Health Workers", "PCG - Coast Guard", "MENRO - Environment"]', 'categories', 'Available responder department categories'),
('email_notifications_enabled', 'true', 'notifications', 'Enable email notifications'),
('sms_notifications_enabled', 'false', 'notifications', 'Enable SMS notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 3. Create audit_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_type VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- 'create_admin', 'delete_admin', 'update_role', 'delete_incident', etc.
    resource_type VARCHAR(50) NOT NULL, -- 'admin', 'incident', 'responder', 'settings', etc.
    resource_id UUID,
    details JSONB, -- Additional context about the action
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 4. Create admin_permissions table (optional)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    can_manage_admins BOOLEAN DEFAULT false,
    can_manage_responders BOOLEAN DEFAULT true,
    can_manage_incidents BOOLEAN DEFAULT true,
    can_manage_announcements BOOLEAN DEFAULT true,
    can_view_analytics BOOLEAN DEFAULT true,
    can_manage_settings BOOLEAN DEFAULT false,
    can_view_audit_logs BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- System Settings Policies
CREATE POLICY "Super admins can manage system settings"
    ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

CREATE POLICY "Admins can view system settings"
    ON system_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type IN ('super_admin', 'admin')
        )
    );

-- Audit Logs Policies
CREATE POLICY "Super admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

CREATE POLICY "System can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Admin Permissions Policies
CREATE POLICY "Super admins can manage all permissions"
    ON admin_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

CREATE POLICY "Admins can view their own permissions"
    ON admin_permissions
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'super_admin'
        )
    );

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND user_type = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_email VARCHAR(255);
    v_user_type VARCHAR(50);
    v_log_id UUID;
BEGIN
    -- Get user details
    SELECT email, user_type INTO v_user_email, v_user_type
    FROM profiles
    WHERE id = p_user_id;

    -- Insert audit log
    INSERT INTO audit_logs (
        user_id, user_email, user_type, action, 
        resource_type, resource_id, details
    )
    VALUES (
        p_user_id, v_user_email, v_user_type, p_action,
        p_resource_type, p_resource_id, p_details
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Update existing admin to super_admin (OPTIONAL - run manually)
-- ============================================
-- Uncomment and modify the email to promote an existing admin to super_admin
-- UPDATE profiles 
-- SET user_type = 'super_admin' 
-- WHERE email = 'your-admin-email@example.com' 
-- AND user_type = 'admin';

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON TABLE audit_logs IS 'Audit trail of all administrative actions';
COMMENT ON TABLE admin_permissions IS 'Granular permissions for admin users';
COMMENT ON COLUMN profiles.user_type IS 'User role: super_admin, admin, responder, resident';
