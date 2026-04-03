
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinalSchema() {
    console.log('START_FINAL_PROBE');
    const { data, error } = await supabase.from('announcements').select('*').limit(1);
    if (error) {
        console.log('PROBE_ERROR: ' + JSON.stringify(error));
    } else {
        const cols = Object.keys(data[0] || {});
        console.log('COLS: ' + JSON.stringify(cols));
    }
    console.log('END_FINAL_PROBE');
}

checkFinalSchema();
