# Database Structure Summary

## Tables Overview

### 1. **profiles** (Primary User Table)
- **Primary Key**: `id` (UUID, references auth.users)
- **User Fields**:
  - `email` (VARCHAR(255), UNIQUE, NOT NULL)
  - `full_name` (VARCHAR(255), NOT NULL)
  - `username` (VARCHAR(255))
  - `user_type` (VARCHAR(20), CHECK: 'admin', 'tourist', 'verified_resident', 'business_owner', 'government_official')
  - `phone_number` (VARCHAR(20))
  - `is_active` (BOOLEAN, DEFAULT true)
  - **`is_verified`** (BOOLEAN, DEFAULT NULL) ← **PRIMARY VERIFICATION FIELD**
  - `verification_status` (VARCHAR(20), DEFAULT NULL, CHECK: 'pending', 'approved', 'rejected')
  - `created_at`, `updated_at` (TIMESTAMP)

**Key Point**: `is_verified` is a BOOLEAN (true/false/null), not a status string. This is the field that should be used for verification.

### 2. **users** (Legacy/Compatibility Table)
- Similar structure to profiles but with `name` instead of `full_name`
- Has same `is_verified` and `verification_status` fields
- May not be actively used (code primarily uses `profiles`)

### 3. **incidents** (Incident Reports Table)
- **Primary Key**: `id` (UUID)
- **Report Fields**:
  - `title` (VARCHAR(255), NOT NULL)
  - `description` (TEXT, NOT NULL)
  - `location` (VARCHAR(255), NOT NULL) ← **May contain hex strings (PostGIS geometry)**
  - `latitude` (DECIMAL(10, 8))
  - `longitude` (DECIMAL(11, 8))
  - `type` or `category` (VARCHAR(50), CHECK: 'Traffic', 'Safety', 'Infrastructure', 'Emergency', 'Weather')
  - `priority` or `severity` (VARCHAR(20), DEFAULT 'medium', CHECK: 'low', 'medium', 'high', 'critical')
  - `status` (VARCHAR(20), DEFAULT 'pending', CHECK: 'pending', 'approved', 'rejected', 'resolved')
  - **`is_verified`** (BOOLEAN, DEFAULT NULL) ← **For incident verification**
  - `reporter_id` (UUID, references users/profiles)
  - `admin_notes` (TEXT)
  - `images` (TEXT[]) - Array of image URLs
  - `created_at`, `updated_at`, `reviewed_at`, `resolved_at` (TIMESTAMP)

**Note**: Table name in code is `incidents`, but schema shows `incident_reports`. The actual table is likely `incidents`.

### 4. **incident_analytics**
- Tracks response times and resolution metrics
- Links to `incident_reports` via `report_id`

### 5. **notifications**
- User notifications system
- Links to users and incident_reports

### 6. **system_settings**
- Key-value store for system configuration
- Used by admin settings

### 7. **admin_profiles**
- Extended profile for administrators
- Stores preferences, permissions, security settings as JSONB
- Links to auth.users via `admin_id`

### 8. **invitation_codes**
- Manages admin invitation codes
- Links to profiles via `created_by` and `used_by`

## Key Findings

1. **Verification System**:
   - **profiles.is_verified**: BOOLEAN (true/false/null)
   - **profiles.verification_status**: VARCHAR (optional, may not be actively used)
   - **Primary field for verification**: `is_verified` (BOOLEAN)

2. **Incident Verification**:
   - **incidents.is_verified**: BOOLEAN (true/false/null)
   - **incidents.status**: VARCHAR ('pending', 'approved', 'rejected', 'resolved')

3. **Location Field Issue**:
   - `location` field may contain PostGIS geometry hex strings
   - Need to filter these out and use `city`/`address` fields instead

4. **Table Naming**:
   - Code uses `incidents` table
   - Schema shows `incident_reports` table
   - Actual table is likely `incidents`

## RLS (Row Level Security) Policies

- All tables have RLS enabled
- Admins can view/update all records
- Users can only view/update their own records
- Public can view approved incidents only

