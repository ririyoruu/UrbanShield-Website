
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeNotifs() {
    console.log('START_NOTIFS_PROBE');
    // Try to view columns by inserting a dummy record (and letting it fail if it doesn't match)
    const { data, error } = await supabase.from('notifications').insert([{}]).select();
    if (error) {
        console.log('NOTIFS_INSERT_ERROR: ' + JSON.stringify(error));
    } else {
        console.log('NOTIFS_COLS: ' + JSON.stringify(Object.keys(data[0])));
        await supabase.from('notifications').delete().eq('id', data[0].id);
    }
    console.log('END_NOTIFS_PROBE');
}

probeNotifs();
