# 🛡️ Super Admin System Guide

## Overview

The Super Admin system provides elevated privileges for managing the entire UrbanShield platform, including admin account management, system settings, and audit logging.

---

## 🎯 Features

### 1. **Admin Management**
Super Admins can:
- ✅ Create new admin accounts
- ✅ Promote/demote admins to super_admin
- ✅ Activate/deactivate admin accounts
- ✅ Delete admin accounts
- ✅ View all admin activity

### 2. **System Settings** (Coming Soon)
- ⚙️ App branding (name, logo, colors)
- 📧 Email/notification settings
- 🏢 Responder categories management
- 🔧 General system configuration

### 3. **Audit Logs**
- 📊 Track all administrative actions
- 🔍 Filter by user, action, resource type
- 📅 Date range filtering
- 💾 Complete audit trail

### 4. **Permissions Management** (Optional)
- 🔒 Granular permission control for regular admins
- 🎛️ Control access to specific features
- 👥 Role-based access control

---

## 📦 Database Schema

### New Tables

#### `system_settings`
```sql
- id: UUID (primary key)
- setting_key: VARCHAR(100) (unique)
- setting_value: JSONB
- category: VARCHAR(50) ('branding', 'notifications', 'categories', 'general')
- description: TEXT
- updated_by: UUID (references auth.users)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `audit_logs`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- user_email: VARCHAR(255)
- user_type: VARCHAR(50)
- action: VARCHAR(100) (e.g., 'create_admin', 'delete_incident')
- resource_type: VARCHAR(50) (e.g., 'admin', 'incident', 'settings')
- resource_id: UUID
- details: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

#### `admin_permissions`
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, unique)
- can_manage_admins: BOOLEAN
- can_manage_responders: BOOLEAN
- can_manage_incidents: BOOLEAN
- can_manage_announcements: BOOLEAN
- can_view_analytics: BOOLEAN
- can_manage_settings: BOOLEAN
- can_view_audit_logs: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Updated Tables

#### `profiles`
- `user_type` now includes: `'super_admin'`, `'admin'`, `'responder'`, `'resident'`
- `role` (optional): VARCHAR(50) for future role expansion

---

## 🚀 Installation

### 1. Run the Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file
# database/migrations/007_add_super_admin_role.sql
```

### 2. Promote Your First Super Admin

After running the migration, promote an existing admin to super_admin:

```sql
UPDATE profiles 
SET user_type = 'super_admin' 
WHERE email = 'your-admin-email@example.com' 
AND user_type = 'admin';
```

### 3. Verify Installation

Check that the tables were created:

```sql
SELECT * FROM system_settings;
SELECT * FROM audit_logs LIMIT 10;
SELECT * FROM admin_permissions;
```

---

## 🔐 Security & Permissions

### Row Level Security (RLS)

All new tables have RLS enabled with the following policies:

**system_settings:**
- Super admins: Full access (SELECT, INSERT, UPDATE, DELETE)
- Regular admins: Read-only access (SELECT)

**audit_logs:**
- Super admins: Read access (SELECT)
- System: Write access (INSERT) - for automatic logging
- No one can delete audit logs

**admin_permissions:**
- Super admins: Full access
- Admins: Can view their own permissions only

### Helper Functions

**`is_super_admin(user_id UUID)`**
- Returns `BOOLEAN`
- Checks if a user has super_admin role

**`log_audit_action(...)`**
- Logs administrative actions to audit_logs
- Automatically captures user details
- Returns the log entry ID

---

## 💻 Usage

### Frontend Components

#### Admin Management Page
```javascript
import AdminManagement from './components/AdminManagement';

// In your AdminDashboard routing:
{activeTab === 'admin-management' && <AdminManagement />}
```

#### Super Admin Service
```javascript
import superAdminService from './services/superAdminService';

// Check if current user is super admin
const isSuperAdmin = await superAdminService.isSuperAdmin();

// Get all admins
const admins = await superAdminService.getAllAdmins();

// Create new admin
await superAdminService.createAdmin({
  email: 'newadmin@example.com',
  password: 'securepassword',
  full_name: 'John Doe',
  user_type: 'admin' // or 'super_admin'
});

// Update admin role
await superAdminService.updateAdminRole(userId, 'super_admin');

// Toggle admin status
await superAdminService.toggleAdminStatus(userId, false); // deactivate

// Get audit logs
const logs = await superAdminService.getAuditLogs({
  user_id: 'specific-user-id',
  action: 'create_admin',
  start_date: '2026-01-01',
  limit: 50
});
```

---

## 📋 Default System Settings

The migration creates these default settings:

| Key | Value | Category |
|-----|-------|----------|
| `app_name` | "UrbanShield" | branding |
| `app_logo_url` | null | branding |
| `primary_color` | "#3b82f6" | branding |
| `responder_categories` | ["BFP - Fire Protection", "PNP - Police", ...] | categories |
| `email_notifications_enabled` | true | notifications |
| `sms_notifications_enabled` | false | notifications |

---

## 🎨 UI Components

### Admin Management Page Features:
- 📊 Admin statistics dashboard
- 🔍 Search and filter admins
- ➕ Create new admin accounts
- 🔄 Change admin roles (admin ↔ super_admin)
- 🔌 Activate/deactivate accounts
- 🗑️ Delete admin accounts
- 👁️ View admin details

### Styling:
- Consistent with existing Zenith table design
- Dark mode support
- Responsive layout
- Accessible UI elements

---

## 🔄 Audit Log Actions

Common audit actions logged automatically:

- `create_admin` - New admin account created
- `delete_admin` - Admin account deleted
- `update_admin_role` - Admin role changed
- `activate_admin` - Admin account activated
- `deactivate_admin` - Admin account deactivated
- `update_setting` - System setting modified
- `create_setting` - New system setting created
- `update_permissions` - Admin permissions changed

---

## 🛠️ Future Enhancements

### Planned Features:
1. **System Settings UI**
   - Visual branding editor
   - Responder category management
   - Notification configuration

2. **Audit Log Viewer**
   - Advanced filtering
   - Export to CSV/PDF
   - Real-time activity feed

3. **Permission Templates**
   - Pre-defined permission sets
   - Quick role assignment
   - Custom permission groups

4. **Two-Factor Authentication**
   - Required for super admins
   - Optional for regular admins

5. **Session Management**
   - View active sessions
   - Force logout capability
   - Session timeout configuration

---

## ⚠️ Important Notes

1. **Super Admin Accounts:**
   - Should be limited to 1-2 trusted individuals
   - Use strong passwords (12+ characters)
   - Enable 2FA when available

2. **Audit Logs:**
   - Cannot be deleted (by design)
   - Stored indefinitely for compliance
   - Regular backups recommended

3. **Permissions:**
   - Super admins bypass all permission checks
   - Regular admins respect permission settings
   - Default permissions are restrictive

4. **Account Deletion:**
   - "Delete" actually deactivates the account
   - Full deletion requires database access
   - Preserves audit trail integrity

---

## 📞 Support

For issues or questions:
- Check the audit logs for troubleshooting
- Review RLS policies if access issues occur
- Ensure migrations ran successfully
- Verify user_type is set correctly

---

## 📝 Changelog

### Version 1.0.0 (2026-03-31)
- ✅ Initial super_admin role implementation
- ✅ Admin management UI
- ✅ Audit logging system
- ✅ System settings table
- ✅ Permission management framework
- ✅ RLS policies for all new tables
- ✅ Helper functions for common operations

---

**Built with ❤️ for UrbanShield**
