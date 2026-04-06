
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeSingleTable(table) {
    console.log(`--- Probing table: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
        console.log(`Table ${table} error: ${error.code} - ${error.message}`);
    } else {
        console.log(`Table ${table} EXISTS, data length: ${data.length}`);
    }
}

async function main() {
    await probeSingleTable('reports');
    await probeSingleTable('incident_reports');
    await probeSingleTable('reported_incidents');
    await probeSingleTable('user_reports');
    await probeSingleTable('reported_posts');
}

main();
