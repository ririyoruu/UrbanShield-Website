const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectAdminTable() {
  const { data, error } = await supabase.from('admin_profiles').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // If it's empty, we need another way to get columns.
  // We can use a query that intentionally fails to show columns in some environments,
  // or we can just try to see if there's any record now (since I migrated some).
  
  if (data && data.length > 0) {
    console.log('Admin Profiles Columns:', Object.keys(data[0]));
  } else {
    console.log('Table is still empty. Checking migration status...');
  }
}
inspectAdminTable();
