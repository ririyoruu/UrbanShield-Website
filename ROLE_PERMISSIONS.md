# UrbanShield Role Permissions & Hierarchy

## Role Hierarchy

The UrbanShield system implements a two-tier privileged user system:

```
Super Admin (Highest Authority)
    ↓
Admin (Limited Scope)
    ↓
Responder
    ↓
Resident
```

---

## 🔴 Super Admin (`user_type = 'super_admin'`)

### Full System Control
Super Admin has **unrestricted access** to all system functions and **always has priority** over Admin actions.

### Permissions:

#### User Management
- ✅ Create, edit, delete, suspend **ANY** user
- ✅ Assign and modify user roles (including promoting/demoting admins)
- ✅ Edit user details (name, email, phone, address, department)
- ✅ View and manage all user verification documents
- ✅ Access complete user activity history

#### Admin & Responder Management
- ✅ Create new admin accounts
- ✅ Promote admin ↔ super admin
- ✅ Delete admin accounts
- ✅ Activate/deactivate admin accounts
- ✅ Manage all responders across all regions

#### Post/Incident Management
- ✅ Edit **ANY** post regardless of ownership
- ✅ Delete **ANY** post (including bulk delete)
- ✅ Override post status (pending, in_action, resolved, duplicate)
- ✅ Bulk actions: resolve, mark duplicate, delete multiple posts
- ✅ Access posts from all regions

#### System Access
- ✅ Live map data across **ALL** regions
- ✅ System-wide analytics and statistics
- ✅ Full audit logs (all admin actions)
- ✅ System configuration and settings
- ✅ Modify system permissions and policies

#### Override Authority
- ✅ Can override **ANY** action performed by an Admin
- ✅ Highest priority in conflict resolution
- ✅ Cannot be suspended or modified by regular Admins

---

## 🟡 Admin (`user_type = 'admin'`)

### Limited Scope Control
Admin users have **restricted access** within their assigned scope and **cannot override** Super Admin actions.

### Permissions:

#### User Management (Scoped)
- ✅ View users within assigned scope
- ✅ Verify/reject user verification requests
- ✅ Suspend/restore regular users (not admins)
- ❌ **CANNOT** edit user details (read-only)
- ❌ **CANNOT** modify user roles
- ❌ **CANNOT** manage other admins

#### Post/Incident Management (Scoped)
- ✅ View and moderate posts within assigned scope
- ✅ Change post status (pending → in_action → resolved)
- ✅ Mark posts as duplicate
- ✅ Add admin notes to posts
- ❌ **CANNOT** delete posts (requires Super Admin)
- ❌ **CANNOT** edit posts created by others
- ❌ **CANNOT** override Super Admin decisions

#### Responder Management (Scoped)
- ✅ View responders within assigned region
- ✅ Assign responders to incidents
- ❌ **CANNOT** create or delete responder accounts
- ❌ **CANNOT** modify responder roles

#### System Access (Limited)
- ✅ Live map data within assigned region
- ✅ Basic analytics for their scope
- ❌ **CANNOT** access full audit logs
- ❌ **CANNOT** modify system configurations
- ❌ **CANNOT** change system permissions

#### Restrictions
- ❌ Cannot manage other admins or super admins
- ❌ Cannot access Admin Management page
- ❌ Cannot override system-level settings
- ❌ Lower priority than Super Admin in all operations

---

## Implementation Details

### Database Schema
```sql
-- profiles table
user_type ENUM('resident', 'responder', 'admin', 'super_admin')

-- Super admin specific tables
- system_settings (super admin only)
- audit_logs (super admin only)
- admin_permissions (super admin only)
```

### Authentication Flow
```javascript
// App.js & authService.js
if (user.user_type === 'super_admin' || user.user_type === 'admin') {
  // Grant dashboard access
  // Super admin gets additional UI elements
}
```

### UI Components

#### Super Admin Only:
- `AdminManagement.js` - Manage all admins
- Edit button in `UserDetailModal.js` - Edit user details
- Bulk delete in `IncidentModeration.js` - Delete multiple posts
- System settings (pending implementation)

#### Both Super Admin & Admin:
- `AdminDashboard.js` - Main dashboard
- `UserManagement.js` - View/verify users (edit only for super admin)
- `IncidentModeration.js` - Moderate posts (delete only for super admin)
- `ResponderManagement.js` - Manage responders

### Permission Checks

```javascript
// Check if user is super admin
const isSuperAdmin = profile?.user_type === 'super_admin';

// Check if user is any admin
const isAdmin = profile?.user_type === 'admin' || profile?.user_type === 'super_admin';

// Super admin exclusive features
{isSuperAdmin && (
  <button>Edit User</button>
  <button>Delete Post</button>
  <Link to="/admin-management">Admin Management</Link>
)}
```

---

## Access Control Matrix

| Feature | Super Admin | Admin | Responder | Resident |
|---------|-------------|-------|-----------|----------|
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| Manage Admins | ✅ | ❌ | ❌ | ❌ |
| Verify Users | ✅ | ✅ (scoped) | ❌ | ❌ |
| Edit Posts | ✅ (all) | ❌ | ❌ | ✅ (own) |
| Delete Posts | ✅ | ❌ | ❌ | ❌ |
| Bulk Actions | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| All Regions Map | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ (all) | ✅ (scoped) | ❌ | ❌ |

---

## Security Notes

1. **Super Admin Creation**: Only via secure script (`scripts/create-super-admin-ready.js`)
2. **Role Changes**: Only Super Admin can promote/demote admins
3. **Audit Trail**: All Super Admin actions are logged in `audit_logs` table
4. **RLS Policies**: Database enforces role-based access at the data layer
5. **Override Priority**: Super Admin actions cannot be reversed by regular Admins

---

## Current Implementation Status

✅ **Completed:**
- Super admin role in database schema
- Authentication for both admin types
- Admin Management UI (super admin only)
- User edit functionality (super admin only)
- Bulk post actions (super admin only)
- Role-based navigation

⏳ **Pending:**
- System settings UI
- Audit log viewer
- Regional scope assignment for admins
- Permission granularity controls

---

## Login Credentials

**Super Admin:**
- Email: `superadmin@urbanshield.com`
- Password: `SuperSecurePassword123!`

**Create New Super Admin:**
```bash
node scripts/create-super-admin-ready.js
```

---

*Last Updated: March 31, 2026*
