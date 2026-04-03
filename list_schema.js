
const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://efiswsdjscypiujrvawp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo');
s.from('incidents').select('*').limit(1).then(r => {
    if (r.data && r.data[0]) {
        console.log(Object.keys(r.data[0]).sort().join('\n'));
    } else {
        console.log('No incidents found');
    }
});
