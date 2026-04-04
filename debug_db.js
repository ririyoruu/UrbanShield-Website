const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDB() {
  console.log('--- Debugging Database ---');
  
  // 1. Check profiles table
  console.log('Checking profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profilesError) {
    console.error('❌ Profiles Table Error:', profilesError.message);
    console.error('Code:', profilesError.code);
    console.error('Details:', profilesError.details);
    console.error('Hint:', profilesError.hint);
  } else {
    console.log('✅ Profiles table is accessible.');
    if (profiles && profiles.length > 0) {
      console.log('Columns:', Object.keys(profiles[0]).join(', '));
    } else {
      console.log('Profiles table is empty.');
    }
  }

  // 2. Check admin_profiles table
  console.log('\nChecking admin_profiles table...');
  const { data: adminProfiles, error: adminProfilesError } = await supabase
    .from('admin_profiles')
    .select('*')
    .limit(1);

  if (adminProfilesError) {
    console.error('❌ Admin Profiles Table Error:', adminProfilesError.message);
    console.error('Code:', adminProfilesError.code);
  } else {
    console.log('✅ Admin Profiles table is accessible.');
  }

  // 3. Check invitation_codes table
  console.log('\nChecking invitation_codes table...');
  const { data: invitations, error: invitationsError } = await supabase
    .from('invitation_codes')
    .select('*')
    .limit(1);

  if (invitationsError) {
    console.error('❌ Invitation Codes Table Error:', invitationsError.message);
    console.error('Code:', invitationsError.code);
  } else {
    console.log('✅ Invitation Codes table is accessible.');
  }
}

debugDB();
