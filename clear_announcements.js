
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAnnouncements() {
    console.log('🗑️ Deleting all announcements...');
    
    // First, fetch all IDs (since delete without eq might be restricted)
    const { data, error: fetchErr } = await supabase.from('announcements').select('id');
    if (fetchErr) {
        console.error('Fetch error:', fetchErr.message);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('✅ No announcements to delete.');
        return;
    }
    
    const ids = data.map(a => a.id);
    console.log(`Found ${ids.length} announcements.`);
    
    const { error: delErr } = await supabase.from('announcements').delete().in('id', ids);
    if (delErr) {
        console.error('Delete error:', delErr.message);
    } else {
        console.log('✅ Successfully deleted all announcements.');
    }
}

clearAnnouncements();
