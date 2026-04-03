const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('--- Inspecting notifications table schema via INSERT-SELECT ---');
  // I need to use an AUTHENTICATED client to bypass RLS, or hope anon has insert access (some do for testing).
  // I'll try to use the key I have.
  
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      type: 'test',
      title: 'Test',
      message: 'Test Message',
      is_read: false
    }])
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  } else {
    console.log('✅ Successfully inserted! Here are the columns:');
    console.log(Object.keys(data[0]).join('\n'));
    // Clean up
    await supabase.from('notifications').delete().eq('id', data[0].id);
  }
}

inspectSchema();
