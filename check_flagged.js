
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFlagged() {
    console.log('Checking incidents table for is_flagged flag...');
    const { data, error, count } = await supabase
        .from('incidents')
        .select('id, title, is_flagged', { count: 'exact' })
        .eq('is_flagged', true);
    
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log(`Found ${count} flagged incidents.`);
        if (data && data.length > 0) {
            console.log('Sample:', data[0]);
        }
    }
}

checkFlagged();
