const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllColumns() {
  try {
    // We can use RPC if available, or just try to get one record and check keys.
    // Since it's empty, we can try to find another way.
    // One way is to check the error message of an invalid query.
    
    const { data, error } = await supabase.from('admin_profiles').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('admin_profiles is empty. Attempting to get schema via profiles...');
        const { data: pData } = await supabase.from('profiles').select('*').limit(1);
        console.log('Profiles columns:', Object.keys(pData[0]));
    }
    
    // Let's try to find if there are any other columns in admin_profiles by looking at the migrations or other scripts.
  } catch (err) {
    console.error(err);
  }
}
getAllColumns();
