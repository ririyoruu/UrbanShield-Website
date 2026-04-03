
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidents() {
    console.log('CHECKING_INCIDENTS');
    const { data, error, count } = await supabase.from('incidents').select('*', { count: 'exact' });
    if (error) {
        console.log('INCIDENTS_ERROR: ' + JSON.stringify(error));
    } else {
        console.log('INCIDENT_COUNT: ' + count);
        if (data.length > 0) {
            console.log('SAMPLE_INCIDENT: ' + JSON.stringify(data[0]));
        }
    }
}

checkIncidents();
