
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeNotifications() {
    console.log('START_NOTIF_PROBE');
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
        console.log('DATA_ERROR: ' + JSON.stringify(error));
        // Try to get column names from query
        const { error: colError } = await supabase.from('notifications').insert([{}]).select();
        console.log('INSERT_ERROR: ' + JSON.stringify(colError));
    } else {
        console.log('NOTIF_COLS: ' + JSON.stringify(Object.keys(data[0] || {})));
    }
    console.log('END_NOTIF_PROBE');
}

probeNotifications();
