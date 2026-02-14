-- Database Diagnostic Script (Final Version for Supabase)
-- Run this in Supabase SQL Editor to see current database state

-- 1. Check existing tables
SELECT 
  'TABLES' as section,
  table_name as name,
  table_type as details,
  is_insertable_into as extra_info
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check columns in incidents table
SELECT 
  'INCIDENTS_COLUMNS' as section,
  column_name as name,
  data_type as details,
  is_nullable || ' | ' || COALESCE(column_default, 'no default') as extra_info
FROM information_schema.columns 
WHERE table_name = 'incidents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check existing RLS policies (fixed array handling)
SELECT 
  'RLS_POLICIES' as section,
  tablename as name,
  policyname as details,
  permissive::text || ' | ' || cmd || ' | ' || COALESCE(ARRAY_TO_STRING(roles, ', '), 'public') as extra_info
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check existing triggers
SELECT 
  'TRIGGERS' as section,
  trigger_name as name,
  event_object_table as details,
  event_manipulation || ' | ' || action_timing as extra_info
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Check existing functions
SELECT 
  'FUNCTIONS' as section,
  routine_name as name,
  routine_type as details,
  external_language as extra_info
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 6. Check sample data counts
SELECT 
  'RECORD_COUNTS' as section,
  table_name as name,
  COUNT(*)::text as details,
  NULL as extra_info
FROM (
  SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
  UNION ALL
  SELECT 'incidents' as table_name, COUNT(*) as record_count FROM incidents
  UNION ALL
  SELECT 'incident_images' as table_name, COUNT(*) as record_count FROM incident_images
  UNION ALL
  SELECT 'incident_activity_log' as table_name, COUNT(*) as record_count FROM incident_activity_log
  UNION ALL
  SELECT 'duplicate_candidates' as table_name, COUNT(*) as record_count FROM duplicate_candidates
) sub
GROUP BY table_name, record_count
ORDER BY table_name;

-- 7. Check incident status distribution (if status column exists)
SELECT 
  'STATUS_DISTRIBUTION' as section,
  COALESCE(status, 'NULL') as name,
  COUNT(*)::text as details,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as extra_info
FROM incidents 
GROUP BY status
ORDER BY count DESC;

-- 8. Check is_verified distribution (legacy field)
SELECT 
  'IS_VERIFIED_DISTRIBUTION' as section,
  COALESCE(is_verified::text, 'NULL') as name,
  COUNT(*)::text as details,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as extra_info
FROM incidents 
GROUP BY is_verified
ORDER BY count DESC;

-- 9. Check for recent activity (if activity_log exists)
SELECT 
  'RECENT_ACTIVITY' as section,
  action as name,
  performed_by::text as details,
  created_at::text as extra_info
FROM incident_activity_log 
ORDER BY created_at DESC 
LIMIT 5;

-- 10. Check extensions
SELECT 
  'EXTENSIONS' as section,
  extname as name,
  extversion as details,
  extrelocatable::text as extra_info
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis')
ORDER BY extname;

-- 11. Check if specific columns exist
SELECT 
  'COLUMN_CHECK' as section,
  column_name as name,
  'EXISTS' as details,
  NULL as extra_info
FROM information_schema.columns 
WHERE table_name = 'incidents' 
  AND column_name IN ('status', 'admin_notes', 'proof_url', 'resolved_at', 'resolved_by', 'assigned_responder_id')
  AND table_schema = 'public'
ORDER BY column_name;
