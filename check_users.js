const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAllProfiles() {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    console.log(`Found ${data.length} profiles in profiles table.`);
    data.forEach(p => console.log(`- ${p.email} (${p.user_type})`));
    
    console.log('\n🔍 Now checking admin_profiles...');
    const { data: adminData, error: adminError } = await supabase.from('admin_profiles').select('*');
    if (adminError) {
        console.log('admin_profiles table issue:', adminError.message);
    } else {
        console.log(`Found ${adminData.length} records in admin_profiles.`);
        adminData.forEach(p => console.log(`- ${p.email} (${p.user_type})`));
    }
  } catch (err) {
    console.error(err);
  }
}
checkAllProfiles();
