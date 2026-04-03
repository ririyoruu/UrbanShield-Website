
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsDeep() {
    console.log('START_DEEP_CHECK');
    const { data, error } = await supabase.from('incidents').select('id, title, status, location, latitude, longitude, address, city, created_at, updated_at, resolved_at');
    if (error) {
        console.log('ERROR: ' + JSON.stringify(error));
    } else {
        console.log('COUNT: ' + data.length);
        data.forEach((inc, idx) => {
            console.log(`INCIDENT_${idx}: ` + JSON.stringify(inc));
        });
    }
    console.log('END_DEEP_CHECK');
}

checkIncidentsDeep();
