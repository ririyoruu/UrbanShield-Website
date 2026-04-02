const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ADMINS = [
  { email: 'admin_shield@urbanshield.com', id: 'ec82efe4-4db3-4e01-9df6-be86047781b0' },
  { email: 'superadmin@urbanshield.com', id: 'f002cb75-7b1b-402c-8153-623992383823' }, // Guessed id from dump if possible, or I'll query it
  { email: 'ririyoru@gmail.com', id: 'e650dd7c-1c11-44c8-875a-209ba15b0ac6' }
];

async function forceMigrate() {
  for (const adm of ADMINS) {
    console.log(`📡 Moving ${adm.email} to admin_profiles...`);
    const { error } = await supabase.from('admin_profiles').upsert({
      admin_id: adm.id,
      email: adm.email,
      full_name: 'Shield Admin',
      user_type: 'super_admin',
      is_staff: true,
      department: 'Management',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });
    
    if (error) console.error(`   ❌ Failed: ${error.message}`);
    else console.log(`   ✅ Success.`);
  }
}
forceMigrate();
