const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProperInsert() {
  console.log('Testing insert with identified columns...');
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      type: 'announcement',
      title: '📢 Test',
      message: 'This is a test notification',
      is_read: false,
      created_at: new Date().toISOString()
      // omitting user_id and data
    }])
    .select();

  if (error) {
    console.log('❌ Insert failed:', error.message);
    if (error.hint) console.log('Hint:', error.hint);
    if (error.details) console.log('Details:', error.details);
  } else {
    console.log('✅ Insert successful!');
    console.log('Inserted ID:', data[0].id);
    await supabase.from('notifications').delete().eq('id', data[0].id);
  }
}

testProperInsert();
