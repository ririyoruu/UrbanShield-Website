# Database Setup Instructions for Settings

## Step 1: Create the Admin Settings Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default management settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('auto_approve_low_priority', 'false', 'boolean', 'Automatically approve incidents marked as low priority'),
('require_approval_for_public', 'true', 'boolean', 'Incidents must be approved before appearing in public view'),
('default_incident_status', 'pending', 'string', 'Default status for new incidents'),
('max_incidents_per_page', '20', 'number', 'Maximum incidents to display per page'),
('incident_retention_days', '365', 'number', 'How long to keep incidents in the system'),
('admin_email', 'admin@urbanshield.com', 'string', 'Admin contact email'),
('timezone', 'Asia/Manila', 'string', 'System timezone')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default user management settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
('require_invitation_codes', 'true', 'boolean', 'New admin accounts must have valid invitation codes'),
('invitation_code_expiry_hours', '168', 'number', 'How long invitation codes remain valid'),
('session_timeout_hours', '24', 'number', 'How long user sessions remain active'),
('enable_audit_log', 'true', 'boolean', 'Log all user actions for monitoring'),
('failed_login_lockout', 'true', 'boolean', 'Lock accounts after multiple failed login attempts'),
('max_failed_attempts', '5', 'number', 'Number of failed attempts before lockout'),
('lockout_duration_minutes', '30', 'number', 'How long to lock account after failed attempts')
ON CONFLICT (setting_key) DO NOTHING;
```

## Step 2: Verify the Table

Check that the table was created and populated:

```sql
SELECT * FROM admin_settings ORDER BY setting_key;
```

## Step 3: Test the Settings

1. Go to the Settings page in your admin dashboard
2. Modify some settings (e.g., change "Max Incidents Per Page" from 20 to 30)
3. Click "Save Management Settings"
4. Refresh the page - your changes should persist
5. Check the database to see the updated values:

```sql
SELECT setting_key, setting_value FROM admin_settings WHERE setting_key = 'max_incidents_per_page';
```

## How It Works

- **Database Storage**: All settings are stored in the `admin_settings` table
- **Type Safety**: Each setting has a type (boolean, number, string, json) for proper conversion
- **Real-time Updates**: Changes are immediately saved to the database
- **Persistence**: Settings persist across browser sessions and page refreshes
- **Default Values**: If no settings exist, the app uses sensible defaults

## Available Settings

### Management Settings:
- `auto_approve_low_priority` - Auto-approve low priority incidents
- `require_approval_for_public` - Require approval for public view
- `default_incident_status` - Default status for new incidents
- `max_incidents_per_page` - Pagination limit
- `incident_retention_days` - Data retention period
- `admin_email` - Admin contact email
- `timezone` - System timezone

### User Management Settings:
- `require_invitation_codes` - Require invitation codes for new admins
- `invitation_code_expiry_hours` - Invitation code validity period
- `session_timeout_hours` - User session duration
- `enable_audit_log` - Enable action logging
- `failed_login_lockout` - Enable login lockout
- `max_failed_attempts` - Failed login threshold
- `lockout_duration_minutes` - Lockout duration
