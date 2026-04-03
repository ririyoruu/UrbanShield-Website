
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsDeep() {
    console.log('START_DEEP_CHECK_V2');
    const { data, error } = await supabase.from('incidents').select('*').limit(1);
    if (error) {
        console.log('ERROR: ' + JSON.stringify(error));
    } else {
        const first = data[0] || {};
        console.log('COLUMNS: ' + JSON.stringify(Object.keys(first)));
        console.log('FULL_DATA: ' + JSON.stringify(data));
    }
    console.log('END_DEEP_CHECK_V2');
}

checkIncidentsDeep();
