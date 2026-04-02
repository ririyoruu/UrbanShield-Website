const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminProfilesSchema() {
  try {
    console.log('🔍 Checking admin_profiles schema...');
    
    // We already know it exists but is empty.
    // Try to get one record or even just the columns via a dummy query? 
    // Actually, I can check if there are any records.
    const { data: adminProfiles, error } = await supabase
      .from('admin_profiles')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching admin_profiles:', error);
      return;
    }
    
    if (adminProfiles && adminProfiles.length > 0) {
        console.log('📋 Columns in admin_profiles:', Object.keys(adminProfiles[0]));
    } else {
        console.log('❌ admin_profiles is empty.');
    }

    // Let's check profiles too
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    if (profiles && profiles.length > 0) {
        console.log('📋 Existing Profile (super_admin):');
        console.log(JSON.stringify(profiles[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminProfilesSchema();
