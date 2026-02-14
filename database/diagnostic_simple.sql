-- Database Diagnostic Script (Simple Version for Supabase)
-- Run each query separately in Supabase SQL Editor

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

-- 2. Check columns in incidents table (run this only if incidents table exists)
SELECT 
  'INCIDENTS_COLUMNS' as section,
  column_name as name,
  data_type as details,
  is_nullable || ' | ' || COALESCE(column_default, 'no default') as extra_info
FROM information_schema.columns 
WHERE table_name = 'incidents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if status column exists
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

-- 4. Check record counts (run each query separately)
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles;

SELECT 'incidents' as table_name, COUNT(*) as count FROM incidents;

-- 5. Check incident status distribution (only if status column exists)
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM incidents 
GROUP BY status
ORDER BY count DESC;

-- 6. Check is_verified distribution
SELECT 
  is_verified,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM incidents 
GROUP BY is_verified
ORDER BY count DESC;

-- 7. Check existing RLS policies
SELECT 
  tablename,
  policyname,
  permissive::text,
  cmd,
  ARRAY_TO_STRING(roles, ', ') as roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Check existing triggers
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. Check existing functions
SELECT 
  routine_name,
  routine_type,
  external_language
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 10. Check extensions
SELECT 
  extname,
  extversion,
  extrelocatable::text
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis')
ORDER BY extname;
