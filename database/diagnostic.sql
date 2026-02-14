-- Database Diagnostic Script
-- Run this in Supabase SQL Editor to see current database state

-- 1. Check existing tables
SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check columns in incidents table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incidents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check existing triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_condition,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Check existing functions
SELECT 
  routine_name,
  routine_type,
  data_type,
  external_language
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 6. Check sample data counts
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
  'incidents' as table_name,
  COUNT(*) as record_count
FROM incidents
UNION ALL
SELECT 
  'incident_images' as table_name,
  COUNT(*) as record_count
FROM incident_images
UNION ALL
SELECT 
  'incident_activity_log' as table_name,
  COUNT(*) as record_count
FROM incident_activity_log
UNION ALL
SELECT 
  'duplicate_candidates' as table_name,
  COUNT(*) as record_count
FROM duplicate_candidates;

-- 7. Check incident status distribution (if status column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'status'
  ) THEN
    RAISE NOTICE '=== Incident Status Distribution ===';
    EXECUTE '
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM incidents 
      GROUP BY status
      ORDER BY count DESC
    ';
  ELSE
    RAISE NOTICE 'Status column does not exist in incidents table';
  END IF;
END $$;

-- 8. Check is_verified distribution (legacy field)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'is_verified'
  ) THEN
    RAISE NOTICE '=== Legacy is_verified Distribution ===';
    EXECUTE '
      SELECT 
        is_verified,
        COUNT(*) as count
      FROM incidents 
      GROUP BY is_verified
      ORDER BY count DESC
    ';
  ELSE
    RAISE NOTICE 'is_verified column does not exist in incidents table';
  END IF;
END $$;

-- 9. Check for recent activity (if activity_log exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incident_activity_log' AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '=== Recent Activity (Last 5) ===';
    EXECUTE '
      SELECT 
        action,
        performed_by,
        created_at
      FROM incident_activity_log 
      ORDER BY created_at DESC 
      LIMIT 5
    ';
  ELSE
    RAISE NOTICE 'incident_activity_log table does not exist';
  END IF;
END $$;

-- 10. Check extensions
SELECT 
  extname,
  extversion,
  extrelocatable
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis')
ORDER BY extname;

RAISE NOTICE '=== Diagnostic Complete ===';
RAISE NOTICE 'Review the results above to understand your current database state';
