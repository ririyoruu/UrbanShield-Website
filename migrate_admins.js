/**
 * MIGRATION SCRIPT: Move Admins to admin_profiles
 * This script identifies all 'admin' and 'super_admin' users in the 'profiles' table
 * and copies/moves them to the 'admin_profiles' table.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateAdmins() {
  console.log('🚀 Starting Administrative Profile Migration...\n');

  try {
    // 1. Fetch current admins from profiles
    const { data: admins, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_type', ['admin', 'super_admin']);

    if (fetchError) throw fetchError;

    if (!admins || admins.length === 0) {
      console.log('ℹ️ No admin or super_admin profiles found in the main profiles table.');
      return;
    }

    console.log(`🔍 Found ${admins.length} administrative accounts to migrate:`);
    admins.forEach(a => console.log(`   - ${a.email} (${a.user_type})`));

    // 2. Insert into admin_profiles
    // We Map the existing profile data to the admin_profile schema
    const adminProfilesToInsert = admins.map(profile => ({
      id: profile.id, // Keep the same UUID
      full_name: profile.full_name,
      email: profile.email,
      user_type: profile.user_type,
      is_staff: true,
      department: profile.department || null,
      position: profile.position || (profile.user_type === 'super_admin' ? 'Chief Administrator' : 'Administrator'),
      is_active: profile.is_active !== false,
      created_at: profile.created_at,
      updated_at: new Date().toISOString()
    }));

    console.log('\n💾 Upserting records into admin_profiles...');
    const { data: inserted, error: insertError } = await supabase
      .from('admin_profiles')
      .upsert(adminProfilesToInsert, { onConflict: 'email' })
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Successfully migrated ${inserted.length} accounts to admin_profiles.`);

    // 3. Optional: Verify the Super Admin specifically
    const superAdmin = inserted.find(i => i.email === 'admin_shield@example.com');
    if (superAdmin) {
      console.log('✨ Super Admin record confirmed in admin_profiles.');
    }

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.log('Check if the admin_profiles table schema matches the expected columns (id, full_name, email, user_type, is_staff, etc.)');
  }
}

migrateAdmins();
