const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getAdminProfilesSchema() {
  try {
    console.log('🔍 Fetching admin_profiles schema via RPC/SQL...');
    
    // We can't do direct SQL but we can try to find an admin and see its keys.
    // However, if it's empty, we can try to insert a dummy and see the error message if it fails, or just check the information_schema if possible.
    
    const { data, error } = await supabase.rpc('get_admin_profiles_schema'); // This likely doesn't exist.
    
    // Let's try to query the information_schema via a trick if possible.
    // Most PostgREST setups don't allow this.
    
    // Instead, let's just try to list ALL profiles and see if any are admins.
    const { data: profiles } = await supabase.from('profiles').select('*').in('user_type', ['admin', 'super_admin']);
    console.log(`Found ${profiles.length} admins in profiles table.`);
    
    if (profiles.length > 0) {
        console.log('Columns in profiles:', Object.keys(profiles[0]));
    }
  } catch (err) {
    console.error(err);
  }
}
getAdminProfilesSchema();
