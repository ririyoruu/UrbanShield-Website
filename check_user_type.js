const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUser() {
  const email = 'admin_shield@example.com';
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_type, email')
      .eq('email', email)
      .single();

    if (error) {
      console.log(`ERROR: ${error.message}`);
      return;
    }

    if (profile) {
      console.log(`USER_EMAIL: ${profile.email}`);
      console.log(`USER_TYPE: ${profile.user_type}`);
    } else {
      console.log('NOT_FOUND');
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
  }
}

checkUser();
