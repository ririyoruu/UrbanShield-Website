const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('announcements').select().limit(1);
  if (error) {
    console.error('Error fetching announcements:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No data found, but table exists.');
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'announcements' });
    if (colError) console.error('RPC check failed:', colError);
    else console.log('RPC Columns:', cols);
  }
}

checkSchema();
