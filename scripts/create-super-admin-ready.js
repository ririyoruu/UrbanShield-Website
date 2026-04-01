// Script: Create Super Admin Account
// Usage: node create-super-admin-ready.js
// Description: Creates a new super admin account in Supabase

const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

// UPDATE THESE VALUES:
const SUPER_ADMIN_DATA = {
  email: 'ririyoru@gmail.com',    // ← CHANGE THIS
  password: 'AianneGaye27!',    // ← CHANGE THIS (min 6 chars)
  full_name: 'Super Administrator',       // ← CHANGE THIS
  username: 'superadmin'                    // ← CHANGE THIS (optional)
};
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createSuperAdmin() {
  console.log('🚀 Creating Super Admin account...\n');

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_DATA.email,
      password: SUPER_ADMIN_DATA.password,
      email_confirm: true,
      user_metadata: {
        full_name: SUPER_ADMIN_DATA.full_name,
        user_type: 'super_admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists. Updating to super_admin...');
        
        // Get user by email
        const { data: userData } = await supabase.auth.admin.listUsers();
        const existingUser = userData.users.find(u => u.email === SUPER_ADMIN_DATA.email);
        
        if (existingUser) {
          // Update profile to super_admin
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              user_type: 'super_admin',
              full_name: SUPER_ADMIN_DATA.full_name,
              username: SUPER_ADMIN_DATA.username,
              verification_status: 'verified',
              is_active: true
            })
            .eq('id', existingUser.id);

          if (updateError) throw updateError;
          
          console.log('✅ Existing user promoted to super_admin!');
          console.log(`   User ID: ${existingUser.id}`);
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authData.user.id);

      // 2. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'super_admin',
          full_name: SUPER_ADMIN_DATA.full_name,
          username: SUPER_ADMIN_DATA.username || SUPER_ADMIN_DATA.email.split('@')[0],
          verification_status: 'verified',
          is_active: true
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;
      console.log('✅ Profile updated with super_admin role');

      // 3. Log to audit_logs
      await supabase.from('audit_logs').insert({
        user_id: authData.user.id,
        user_email: SUPER_ADMIN_DATA.email,
        user_type: 'super_admin',
        action: 'create_super_admin',
        resource_type: 'admin',
        resource_id: authData.user.id,
        details: { method: 'script', full_name: SUPER_ADMIN_DATA.full_name }
      });
    }

    console.log('\n🎉 SUCCESS! Super Admin account ready!');
    console.log('\n📧 Login Credentials:');
    console.log(`   Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
    console.log('\n🔗 Login at your admin dashboard');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure migration 007 has been run');
    console.log('   - Check if user_type includes "super_admin"');
    console.log('   - Verify service_role key is correct');
    process.exit(1);
  }
}

createSuperAdmin();
