
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncReports() {
    console.log('--- Checking table: incident_reports ---');
    const { data: reports, error: reportsError, count: reportsCount } = await supabase
        .from('incident_reports')
        .select('*', { count: 'exact' });
    
    if (reportsError) {
        console.log('X Table "incident_reports" error:', reportsError.message);
    } else {
        console.log('✓ Table "incident_reports" exists, count:', reportsCount);
        console.log('Sample data:', reports.slice(0, 1));
    }
}

checkIncReports();
