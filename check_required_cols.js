const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesAccess() {
  console.log('--- Checking profiles access and schema ---');
  
  // Try to get my own profile? (Wait, I'm not signed in in node)
  // Let's try to get ALL profiles as anon.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Profiles Table Error:', error.message);
    console.error('Code:', error.code);
    return;
  }

  if (data && data.length > 0) {
    const profile = data[0];
    console.log('✅ Profiles table exists and has data.');
    console.log('Available columns:', Object.keys(profile));
    
    // Check missing columns from the authService query
    const required = ['user_type', 'verification_status', 'email', 'full_name'];
    const missing = required.filter(col => !(col in profile));
    
    if (missing.length > 0) {
      console.log('❌ Missing columns:', missing.join(', '));
    } else {
      console.log('✅ All required columns for authService are present.');
    }
  } else {
    console.log('✅ Profiles table exists but is empty.');
  }
}

checkProfilesAccess();
