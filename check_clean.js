const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  let output = '';
  output += 'Starting check...\n';
  
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    output += `❌ Error: ${error.message}\n`;
    output += `Code: ${error.code}\n`;
    output += `Details: ${error.details}\n`;
  } else {
    output += `✅ Found notifications table!\n`;
    if (data && data.length > 0) {
      output += `Columns: ${Object.keys(data[0]).join(', ')}\n`;
    } else {
      output += `Table is empty.\n`;
    }
  }
  
  fs.writeFileSync('check_result.txt', output);
  console.log('Result written to check_result.txt');
}

check();
