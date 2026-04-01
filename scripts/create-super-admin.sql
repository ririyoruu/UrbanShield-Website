-- =====================================================
-- Create Super Admin Account - SQL Only
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Create the auth user
-- Note: You need to manually create the user in Supabase Dashboard first
-- OR use the Supabase Auth Admin API

-- Alternative: Use this function to create super admin from an existing admin

-- First, let's check if you have any existing admins
SELECT id, email, full_name, user_type, created_at 
FROM profiles 
WHERE user_type IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- =====================================================
-- OPTION A: Promote an existing admin to super_admin
-- =====================================================
-- Uncomment and run this to promote an existing admin:
/*
UPDATE profiles 
SET 
  user_type = 'super_admin',
  verification_status = 'verified',
  is_active = true,
  updated_at = NOW()
WHERE email = 'your-existing-admin@example.com'  -- ← CHANGE THIS EMAIL
  AND user_type = 'admin';

-- Verify the change
SELECT id, email, full_name, user_type, verification_status 
FROM profiles 
WHERE user_type = 'super_admin';
*/

-- =====================================================
-- OPTION B: Create a new super admin via Supabase Dashboard
-- =====================================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" or "Invite user"
-- 3. Enter the email and password
-- 4. Then run this SQL to set them as super_admin:

/*
UPDATE profiles 
SET 
  user_type = 'super_admin',
  full_name = 'Super Administrator',  -- ← CHANGE THIS NAME
  username = 'superadmin',          -- ← CHANGE THIS USERNAME
  verification_status = 'verified',
  is_active = true,
  updated_at = NOW()
WHERE email = 'new-superadmin@example.com';  -- ← CHANGE THIS EMAIL

-- Verify
SELECT id, email, full_name, user_type, verification_status, is_active
FROM profiles 
WHERE user_type = 'super_admin';
*/

-- =====================================================
-- OPTION C: Edge Function approach (if you deploy it)
-- =====================================================
-- See scripts/create-super-admin-edge-function.ts

-- =====================================================
-- Quick verification after creating super admin
-- =====================================================

-- Check all super admins
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.username,
  p.user_type,
  p.verification_status,
  p.is_active,
  p.created_at
FROM profiles p
WHERE p.user_type = 'super_admin'
ORDER BY p.created_at DESC;

-- Count by user type
SELECT 
  user_type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM profiles
WHERE user_type IN ('super_admin', 'admin')
GROUP BY user_type;

-- Log the action (if you created a super admin)
/*
INSERT INTO audit_logs (
  user_id,
  user_email,
  user_type,
  action,
  resource_type,
  resource_id,
  details
)
SELECT 
  id,
  email,
  'super_admin',
  'create_super_admin',
  'admin',
  id,
  jsonb_build_object('method', 'sql', 'note', 'Initial super admin setup')
FROM profiles
WHERE user_type = 'super_admin'
ORDER BY updated_at DESC
LIMIT 1;
*/
