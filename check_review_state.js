
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase.from('incidents').select('id, title, is_under_review, status, location, address');
    if (data) {
        console.log('REPORTS_OVERVIEW:');
        data.forEach(r => {
            console.log(`ID: ${r.id} | UnderReview: ${r.is_under_review} | Status: ${r.status} | HasLoc: ${!!r.location} | HasAddr: ${!!r.address}`);
        });
    }
}
check();
