
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('START_TEST');
    const payload = {
        title: 'Real Test ' + new Date().toISOString(),
        content: 'Testing the announcement creation flow',
        alert_level: 'info',
        alert_type: 'Test',
        areas: 'Test Area',
        action_items: ['Step 1'],
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('announcements')
        .insert([payload])
        .select()
        .single();
    
    if (error) {
        console.log('INSERT_ERROR: ' + JSON.stringify(error));
    } else {
        console.log('INSERT_SUCCESS: ' + data.id);
        // Clean up
        await supabase.from('announcements').delete().eq('id', data.id);
    }
    console.log('END_TEST');
}

testInsert();
