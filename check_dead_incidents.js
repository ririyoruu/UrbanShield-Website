
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeadIncidents() {
    console.log('CHECKING_DEAD_INCIDENTS');
    const { data, error } = await supabase.from('incidents').select('id, title, location, address');
    if (error) {
        console.log('ERROR: ' + JSON.stringify(error));
    } else {
        const dead = data.filter(inc => !inc.location && !inc.address);
        console.log('TOTAL_DEAD: ' + dead.length);
        dead.forEach(inc => {
            console.log('DEAD_INCIDENT: ' + JSON.stringify(inc));
        });
    }
}

checkDeadIncidents();
