
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullProbe() {
    console.log('START_PROBE');
    const { data, error } = await supabase.from('announcements').select('*').limit(1);
    if (error) {
        console.log('PROBE_ERROR: ' + JSON.stringify(error));
        // Try to get info schema if possible (usually not allowed with anon)
    } else {
        const firstRow = data[0] || {};
        console.log('COLUMNS: ' + JSON.stringify(Object.keys(firstRow)));
    }

    // Try a blind insert of only title and content to see success
    const { data: ins, error: insErr } = await supabase.from('announcements').insert([{title: 'TEST', content: 'TEST'}]).select();
    if (insErr) {
        console.log('BLIND_INSERT_ERROR: ' + JSON.stringify(insErr));
    } else {
        console.log('BLIND_INSERT_SUCCESS. FULL_COLS: ' + JSON.stringify(Object.keys(ins[0])));
        await supabase.from('announcements').delete().eq('id', ins[0].id);
    }
    console.log('END_PROBE');
}

fullProbe();
