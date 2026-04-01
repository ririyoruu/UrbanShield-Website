// Script: Create Super Admin Account
// Usage: node create-super-admin.js
// Description: Creates a new super admin account in Supabase

const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION - Update these values
// ============================================
const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'your-service-role-key-here'; // Get from Supabase Dashboard > Project Settings > API > service_role key

const SUPER_ADMIN_DATA = {
  email: 'superadmin@urbanshield.com',    // Change to desired email
  password: 'SuperSecurePassword123!',     // Change to strong password (min 6 chars)
  full_name: 'Super Administrator',        // Change to desired name
  username: 'superadmin'                   // Optional username
};
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin account...');
    console.log(`📧 Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`👤 Name: ${SUPER_ADMIN_DATA.full_name}`);
    console.log('');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_DATA.email,
      password: SUPER_ADMIN_DATA.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: SUPER_ADMIN_DATA.full_name,
        user_type: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', authData.user.id);

    // 2. Update profile with super_admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: 'super_admin',
        full_name: SUPER_ADMIN_DATA.full_name,
        username: SUPER_ADMIN_DATA.username || SUPER_ADMIN_DATA.email.split('@')[0],
        verification_status: 'verified',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Profile updated with super_admin role');

    // 3. Log the action to audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: authData.user.id,
        user_email: SUPER_ADMIN_DATA.email,
        user_type: 'super_admin',
        action: 'create_super_admin',
        resource_type: 'admin',
        resource_id: authData.user.id,
        details: {
          method: 'script',
          full_name: SUPER_ADMIN_DATA.full_name,
          username: SUPER_ADMIN_DATA.username
        }
      });

    if (auditError) {
      console.warn('⚠️ Could not log to audit_logs:', auditError.message);
    } else {
      console.log('✅ Action logged to audit_logs');
    }

    console.log('');
    console.log('🎉 Super Admin account created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`  Password: ${SUPER_ADMIN_DATA.password}`);
    console.log('');
    console.log('You can now log in at: https://your-app-url.com/admin');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
