const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('--- Checking RLS Policies for profiles ---');
  // We can't query pg_policies directly via Supabase client usually (it's in a different schema/restricted)
  // but we can try to see if we can read ANY profile using the anon key.
  // If anon can see profiles, then RLS is either off or very open.
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, user_type')
    .limit(5);

  if (error) {
    if (error.code === '42501') {
      console.log('❌ Permission Denied (42501) - RLS is likely blocking anon.');
    } else {
      console.error('❌ Error:', error.message, 'Code:', error.code);
    }
  } else {
    console.log('✅ Anon can see profiles. Data count:', data.length);
    if (data.length > 0) {
      console.log('Sample profiles:', data.map(p => ({id: p.id, type: p.user_type})));
    }
  }

  // Check if we can insert (test if RLS is totally off)
  const tempId = '00000000-0000-0000-0000-000000000000'; // Just a test ID
  const { error: insError } = await supabase
    .from('profiles')
    .insert([{ id: tempId, full_name: 'Test' }]);
    
  if (insError) {
    console.log('❌ Anon cannot insert into profiles (Normal/Expected if RLS is on). Error:', insError.message);
  } else {
    console.log('⚠️ ALERT: Anon CAN insert into profiles! RLS might be disabled or misconfigured.');
    // cleanup
    await supabase.from('profiles').delete().eq('id', tempId);
  }
}

checkRLS();
