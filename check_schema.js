const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('START_PROBE');
    
    // 1. Announcements
    const { data: annData, error: annError } = await supabase.from('announcements').select('*').limit(1);
    if (annError) {
        console.log('ANN_ERROR: ' + JSON.stringify(annError));
    } else {
        console.log('ANN_COLS: ' + JSON.stringify(Object.keys(annData[0] || {})));
        console.log('ANN_SAMPLE: ' + JSON.stringify(annData[0] || {}));
    }

    // 2. Notifications
    const { data: notifData, error: notifError } = await supabase.from('notifications').select('*').limit(1);
    if (notifError) {
        console.log('NOTIF_ERROR: ' + JSON.stringify(notifError));
    } else {
        console.log('NOTIF_COLS: ' + JSON.stringify(Object.keys(notifData[0] || {})));
        console.log('NOTIF_SAMPLE: ' + JSON.stringify(notifData[0] || {}));
    }

    // 3. Test insert into announcements
    const testAnn = {
        title: 'Test ' + Date.now(),
        content: 'Test content',
        alert_level: 'info',
        is_pinned: false
    };
    const { data: insAnn, error: insAnnErr } = await supabase.from('announcements').insert([testAnn]).select();
    if (insAnnErr) {
        console.log('INS_ANN_ERROR: ' + JSON.stringify(insAnnErr));
    } else {
        console.log('INS_ANN_SUCCESS: ' + JSON.stringify(insAnn[0]));
    }

    // 4. Test insert into notifications (common source of failures)
    const testNotif = {
        type: 'announcement',
        title: 'Test',
        message: 'Test message',
        is_read: false
    };
    const { data: insNotif, error: insNotifErr } = await supabase.from('notifications').insert([testNotif]).select();
    if (insNotifErr) {
        console.log('INS_NOTIF_ERROR: ' + JSON.stringify(insNotifErr));
    } else {
        console.log('INS_NOTIF_SUCCESS: ' + JSON.stringify(insNotif[0]));
    }

    console.log('END_PROBE');
}

checkSchema();
