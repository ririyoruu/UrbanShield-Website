
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResidents() {
    console.log('CHECKING_RESIDENTS');
    const { data, error } = await supabase.from('profiles').select('id, user_type').eq('user_type', 'resident').limit(5);
    if (error) {
        console.log('RESIDENTS_ERROR: ' + JSON.stringify(error));
    } else {
        console.log('RESIDENTS: ' + JSON.stringify(data));
    }
}

checkResidents();
