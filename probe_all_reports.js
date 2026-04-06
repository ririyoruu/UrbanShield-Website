
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTablesWithData() {
    // We can't list tables easily, so we'll try common suffixes and synonyms
    const synonyms = [
        'reports', 'reported_posts', 'post_reports', 'incident_reports', 
        'user_reports', 'flagged_posts', 'moderation_cases', 'reported_content',
        'reported_incidents', 'complaints', 'feedback'
    ];
    
    console.log('Searching for tables with records...');

    for (const table of synonyms) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (!error) {
            console.log(`✓ [${table}] EXISTS - Count: ${count}`);
        } else if (error.code !== '42P01') { // 42P01 is "relation does not exist"
             console.log(`? [${table}] ERROR: ${error.code} - ${error.message}`);
        }
    }
}

findTablesWithData();
