
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('START_LIST');
    
    // We can't use postgrest to query information_schema directly with anon key usually
    // But we can try to guess or use RPC if there's one
    
    // Let's try some common table names
    const suspects = ['notifications', 'system_notifications', 'announcements', 'incidents', 'profiles', 'admin_profiles', 'staff_profiles'];
    for (const s of suspects) {
        const { error } = await supabase.from(s).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`Table ${s}: ERROR ${error.code} - ${error.message}`);
        } else {
            console.log(`Table ${s}: EXISTS`);
        }
    }

    console.log('END_LIST');
}

listTables();
