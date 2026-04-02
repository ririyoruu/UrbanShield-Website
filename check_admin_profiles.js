const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminProfiles() {
  try {
    console.log('🔍 Checking if admin_profiles table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('admin_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ admin_profiles table does not exist.');
      } else {
        console.error('❌ Error checking admin_profiles:', tableError);
      }
      return;
    }
    
    console.log('✅ admin_profiles table exists.');
    console.log('Sample data:', JSON.stringify(tableData[0], null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminProfiles();
