
const { createClient } = require('@supabase/supabase-js');

async function testProject(url, key, name) {
    console.log(`\n--- Testing Project: ${name} (${url}) ---`);
    const supabase = createClient(url, key);
    
    try {
        const { data, error } = await supabase.from('announcements').select('*').limit(1);
        if (error) {
            console.error(`${name} Error:`, error.message);
            if (error.hint) console.log('Hint:', error.hint);
            return null;
        }
        console.log(`${name} Succesfully connected!`);
        console.log(`${name} Announcements sample:`, data[0]);
        console.log(`${name} Columns:`, data[0] ? Object.keys(data[0]) : 'None');
        return data[0] ? Object.keys(data[0]) : [];
    } catch (e) {
        console.error(`${name} Exception:`, e.message);
        return null;
    }
}

async function run() {
    const proj1 = {
        url: 'https://efiswsdjscypiujrvawp.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo',
        name: 'Config/Supabase.js'
    };

    const proj2 = {
        url: 'https://jphydwbpizcmltrehuyp.supabase.co/',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8',
        name: 'Test/Update Scripts'
    };

    await testProject(proj1.url, proj1.key, proj1.name);
    await testProject(proj2.url, proj2.key, proj2.name);
}

run();
