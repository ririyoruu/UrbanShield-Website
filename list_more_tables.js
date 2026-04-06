
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Attempting to list all tables in public schema...');
    
    // This often fails with anon key due to permissions on information_schema
    const { data, error } = await supabase.rpc('get_tables'); // Try a custom RPC if it exists
    
    if (error) {
        console.log('RPC get_tables failed:', error.message);
        
        // Try another way: query a table that definitely exists and see if we can get schema info? No.
        // Let's try many more guesses
        const guesses = [
            'reports', 'user_reports', 'incident_reports', 'reported_posts', 'reported_incidents',
            'post_reports', 'flagged_posts', 'moderation_reports', 'content_reports', 'reports_table',
            'report', 'reported', 'flagged', 'moderation'
        ];
        
        for (const g of guesses) {
            const { count, error: e } = await supabase.from(g).select('*', { count: 'exact', head: true });
            if (!e) {
                console.log(`Table found: ${g}, Count: ${count}`);
            }
        }
    } else {
        console.log('Tables found via RPC:', data);
    }
}

listAllTables();
