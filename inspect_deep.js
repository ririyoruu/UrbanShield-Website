const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectWithServiceRole() {
  console.log('--- Database Inspection (Service Role) ---');
  
  // 1. Check profiles table columns
  console.log('Inspecting profiles table...');
  const { data: cols, error: colsErr } = await supabase.rpc('get_columns', { table_name: 'profiles' });
  // If rpc not found, try selecting 1 row and getting keys
  const { data: profile, error: profErr } = await supabase.from('profiles').select('*').limit(1);
  
  if (profile && profile.length > 0) {
    console.log('✅ Profiles table exists. Columns:', Object.keys(profile[0]));
    console.log('Sample profile:', JSON.stringify(profile[0], null, 2));
  } else {
    console.log('❌ Profiles table empty or not found. Error:', profErr?.message);
  }

  // 2. Check if there are any users in auth.users
  console.log('Checking auth users...');
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error('❌ Auth Users Error:', usersErr.message);
  } else {
    console.log('✅ Auth users count:', users.users.length);
    console.log('Users:', users.users.map(u => ({id: u.id, email: u.email, metadata: u.user_metadata})));
  }

  // 3. Check RLS policies using a raw query if possible (or just assume they are on)
  // We can check if is_admin function is correct
  console.log('Checking is_super_admin for known admin...');
  const adminId = '75761622-af1d-49c6-8c48-d3dad6941241';
  const { data: isSuper, error: rpcErr } = await supabase.rpc('is_super_admin', { user_id: adminId });
  console.log('is_super_admin result:', isSuper, rpcErr?.message);
}

inspectWithServiceRole();
