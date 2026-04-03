const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotNul() {
  console.log('Testing for NOT NULL columns in notifications...');
  // Inserting an empty object; Supabase/PostGrest will attempt to insert and fail if NOT NULL columns are missing.
  const { data, error } = await supabase.from('notifications').insert([{}]).select();
  if (error) {
     console.log('Error code:', error.code);
     console.log('Error message:', error.message);
     console.log('Details:', error.details);
  } else {
     console.log('Successfully inserted empty record (all columns are nullable or have defaults)');
     await supabase.from('notifications').delete().eq('id', data[0].id);
  }
}

testNotNul();
