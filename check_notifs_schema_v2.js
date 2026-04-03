const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Fetching notifications table schema details...');
  
  // Use a query that will fail if any columns are missing, or use select(*) on an empty table
  // Since I can't easily query information_schema via PostGrest, 
  // I'll try to insert a record with NO fields and see what it says is required.
  
  const { data, error } = await supabase
    .from('notifications')
    .insert([{}])
    .select();

  if (error) {
    console.log('Error message:', error.message);
    if (error.details) console.log('Details:', error.details);
    if (error.hint) console.log('Hint:', error.hint);
  } else {
    console.log('Successfully inserted empty-ish record!');
    console.log('Data[0] keys:', Object.keys(data[0]));
    // Delete it 
    await supabase.from('notifications').delete().eq('id', data[0].id);
  }
}

checkSchema();
