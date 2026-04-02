const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifs() {
  console.log('Checking notifications table schema...');
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Found notifications table!');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table exists but is empty.');
      // Try to get columns anyway if possible? 
      // Actually, PGRST doesn't easily show columns of empty table without another query.
    }
  }
}

checkNotifs();
