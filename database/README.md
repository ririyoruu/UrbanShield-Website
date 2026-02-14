# Database Setup for Incident Moderation System

This directory contains the Supabase PostgreSQL database schema, migrations, and seed data for the incident moderation workflow.

## Database Schema

The database supports the following workflow:
1. **Pending** → User reports an incident
2. **In Action** → Admin clicks "Start Action" 
3. **Resolved** → Admin clicks "Mark as Resolved" with optional notes/proof
4. **Duplicate** → Automatically detected and flagged

## Files

### Core Schema
- `schema.sql` - Complete database schema with all tables, indexes, RLS policies, and functions

### Migrations
Run these in order:
1. `001_add_status_fields.sql` - Adds status flow fields to incidents table
2. `002_add_activity_log.sql` - Creates audit trail table
3. `003_add_duplicate_detection.sql` - Adds duplicate detection functionality

### Seed Data
- `seed_data.sql` - Sample data for testing the moderation workflow

## Key Tables

### `profiles`
User management with roles: `user`, `admin`, `government`, `responder`

### `incidents`
Main incident reports with status flow:
- `status`: `pending` | `in_action` | `resolved` | `duplicate`
- `admin_notes`: Notes added when resolving
- `proof_url`: Evidence image when resolved
- `resolved_at` / `resolved_by`: Resolution metadata

### `incident_images`
Multiple images per incident

### `incident_activity_log`
Audit trail of all actions:
- `created`, `start_action`, `resolved`, `flagged_duplicate`

### `duplicate_candidates`
Potential duplicates detected by similarity algorithm

## Status Flow Logic

### Frontend (Admin)
1. **Pending** incident shows "Start Action" button
2. Clicking "Start Action" → status becomes `in_action`
3. **In Action** incident shows "Mark as Resolved" button
4. Clicking "Mark as Resolved" → opens modal for notes/proof
5. Submitting modal → status becomes `resolved`

### Backend (Database)
- Triggers automatically log all status changes to `incident_activity_log`
- Duplicate detection runs on new incidents
- High similarity (>0.8) automatically marks as `duplicate`

## Duplicate Detection Algorithm

The `find_duplicate_incidents()` function calculates similarity based on:
- **Title similarity (40%)** - Text matching in titles
- **Category match (30%)** - Exact category match
- **Location proximity (20%)** - Within ~1km
- **Time proximity (10%)** - Within 24 hours

**Threshold**: 0.6 similarity to flag as potential duplicate
**Auto-flag**: >0.8 similarity automatically marks as duplicate

## Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Note your project URL and anon key

### 2. Run Schema
```sql
-- In Supabase SQL Editor
-- Run schema.sql first
```

### 3. Run Migrations (if upgrading existing database)
```sql
-- Run in order
-- 001_add_status_fields.sql
-- 002_add_activity_log.sql  
-- 003_add_duplicate_detection.sql
```

### 4. Add Seed Data (optional, for testing)
```sql
-- Run seed_data.sql
```

### 5. Configure Environment Variables
Update your `.env` file:
```env
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Testing the Workflow

### Admin Flow
1. Login as admin (`admin@emergency.com`)
2. Go to Incident Moderation
3. See pending incidents with "Start Action" button
4. Click "Start Action" → status changes to "In Action"
5. Click "Mark as Resolved" → add notes/proof
6. Status becomes "Resolved"

### Duplicate Detection
1. Create incident similar to existing one
2. System automatically detects duplicates
3. High similarity (>0.8) auto-flags as duplicate
4. Lower similarity shows in duplicate candidates

### User End Logic
As requested, the user experience follows this flow:
- **User reports** → Status: `pending`
- **Admin starts action** → Status: `in_action` (visible to users as "being handled")
- **Admin resolves** → Status: `resolved` (visible to users as "completed")

## Important Notes

### Backward Compatibility
- `is_verified` field kept for legacy data
- Migration script converts existing `is_verified` values to new `status`

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only see their own incidents
- Admins can see all incidents and activity logs

### Performance
- Indexes on all frequently queried columns
- Duplicate detection optimized with similarity thresholds
- Activity log for audit trail

### Extensions Required
- `uuid-ossp` - For UUID generation
- `postgis` - For advanced location queries (optional)

## API Functions

### Duplicate Detection
```sql
SELECT * FROM find_duplicate_incidents(
  'Fire on Main Street',
  'Building fire with smoke',
  'fire',
  40.7128,
  -74.0060,
  NOW()
);
```

### Status Statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM incidents 
GROUP BY status;
```

### Recent Activity
```sql
SELECT 
  i.title,
  il.action,
  il.created_at,
  p.full_name as performed_by_name
FROM incident_activity_log il
JOIN incidents i ON il.incident_id = i.id
LEFT JOIN profiles p ON il.performed_by = p.id
ORDER BY il.created_at DESC
LIMIT 10;
```
