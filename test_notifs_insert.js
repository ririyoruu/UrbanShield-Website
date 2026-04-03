const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert into notifications table...');
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      type: 'test',
      title: 'Test Title',
      message: 'Test Message',
      data: {
        test: true
      },
      is_read: false,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('✅ Insert successful!');
    console.log('Data:', data);
    
    // Clean up
    await supabase.from('notifications').delete().eq('id', data[0].id);
    console.log('Test record cleaned up.');
  }
}

testInsert();
