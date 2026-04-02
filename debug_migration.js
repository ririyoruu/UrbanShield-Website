const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findAdminsInProfiles() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error('Fetch error:', error);
    return;
  }
  
  if (profiles.length === 0) {
    console.log('Main profiles table is empty.');
    return;
  }
  
  console.log(`Found ${profiles.length} total profiles:`);
  profiles.forEach(p => {
    console.log(JSON.stringify({
      email: p.email,
      user_type: p.user_type,
      id: p.id
    }, null, 2));
  });
}

findAdminsInProfiles();
