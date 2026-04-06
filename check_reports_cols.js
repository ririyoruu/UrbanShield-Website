
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('--- Checking columns of "reports" table ---');
    // Try to select one row and see the keys
    const { data, error } = await supabase.from('reports').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
        // If it's a column issue, we might get a "column does not exist" error
        // Let's try select * without order
        const { error: error2 } = await supabase.from('reports').select('*').limit(1);
        console.log('Error without order:', error2?.message);
    } else {
        console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'No rows found to check keys');
    }
}

checkColumns();
