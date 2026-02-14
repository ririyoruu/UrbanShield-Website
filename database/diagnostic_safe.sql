-- Database Diagnostic Script (Safe Version)
-- Only checks existing tables - won't error on missing tables

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

-- 2. Check columns in incidents table (only if incidents exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incidents' AND table_schema = 'public'
  ) THEN
    -- 2a. Check columns in incidents table
    SELECT 
      'INCIDENTS_COLUMNS' as section,
      column_name as name,
      data_type as details,
      is_nullable || ' | ' || COALESCE(column_default, 'no default') as extra_info
    FROM information_schema.columns 
    WHERE table_name = 'incidents' 
      AND table_schema = 'public'
    ORDER BY ordinal_position;
    
    -- 2b. Check incident status distribution
    SELECT 
      'STATUS_DISTRIBUTION' as section,
      COALESCE(status, 'NULL') as name,
      COUNT(*)::text as details,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as extra_info
    FROM incidents 
    GROUP BY status
    ORDER BY count DESC;
    
    -- 2c. Check is_verified distribution
    SELECT 
      'IS_VERIFIED_DISTRIBUTION' as section,
      COALESCE(is_verified::text, 'NULL') as name,
      COUNT(*)::text as details,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as extra_info
    FROM incidents 
    GROUP BY is_verified
    ORDER BY count DESC;
    
    -- 2d. Check if specific columns exist
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
  END IF;
END $$;

-- 3. Check existing RLS policies (only if tables exist)
DO $$
BEGIN
  -- Check if any tables have RLS policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    LIMIT 1
  ) THEN
    SELECT 
      'RLS_POLICIES' as section,
      tablename as name,
      policyname as details,
      permissive::text || ' | ' || cmd || ' | ' || COALESCE(ARRAY_TO_STRING(roles, ', '), 'public') as extra_info
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  END IF;
END $$;

-- 4. Check existing triggers (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    LIMIT 1
  ) THEN
    SELECT 
      'TRIGGERS' as section,
      trigger_name as name,
      event_object_table as details,
      event_manipulation || ' | ' || action_timing as extra_info
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  END IF;
END $$;

-- 5. Check existing functions (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    LIMIT 1
  ) THEN
    SELECT 
      'FUNCTIONS' as section,
      routine_name as name,
      routine_type as details,
      external_language as extra_info
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
    ORDER BY routine_name;
  END IF;
END $$;

-- 6. Check record counts for existing tables only
DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Create temporary table to store results
  CREATE TEMP TABLE IF NOT EXISTS temp_record_counts (
    section TEXT,
    name TEXT,
    details TEXT,
    extra_info TEXT
  );
  
  -- Clear the temp table
  TRUNCATE temp_record_counts;
  
  -- Check each table that exists
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('profiles', 'incidents', 'incident_images', 'incident_activity_log', 'duplicate_candidates')
    ORDER BY table_name
  LOOP
    EXECUTE format('
      INSERT INTO temp_record_counts (section, name, details, extra_info)
      SELECT 
        ''RECORD_COUNTS'' as section,
        ''%I'' as name,
        COUNT(*)::text as details,
        NULL as extra_info
      FROM %I
    ', table_record.table_name, table_record.table_name);
  END LOOP;
  
  -- Return the results
  SELECT * FROM temp_record_counts ORDER BY name;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_record_counts;
END $$;

-- 7. Check recent activity (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incident_activity_log' AND table_schema = 'public'
  ) THEN
    SELECT 
      'RECENT_ACTIVITY' as section,
      action as name,
      performed_by::text as details,
      created_at::text as extra_info
    FROM incident_activity_log 
    ORDER BY created_at DESC 
    LIMIT 5;
  END IF;
END $$;

-- 8. Check extensions
SELECT 
  'EXTENSIONS' as section,
  extname as name,
  extversion as details,
  extrelocatable::text as extra_info
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis')
ORDER BY extname;
