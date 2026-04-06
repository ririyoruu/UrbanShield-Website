
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReports() {
    console.log('--- Checking table: reports ---');
    const { data: reports, error: reportsError, count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact' });
    
    if (reportsError) {
        console.log('X Table "reports" error:', reportsError.message);
    } else {
        console.log('✓ Table "reports" exists, count:', reportsCount);
        console.log('Sample data:', reports.slice(0, 1));
    }

    console.log('\n--- Checking table: user_reports ---');
    const { data: userReports, error: userReportsError, count: userReportsCount } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact' });
    
    if (userReportsError) {
        console.log('X Table "user_reports" error:', userReportsError.message);
    } else {
        console.log('✓ Table "user_reports" exists, count:', userReportsCount);
    }

    console.log('\n--- Checking table: reported_posts ---');
    const { data: reportedPosts, error: reportedPostsError, count: reportedPostsCount } = await supabase
        .from('reported_posts')
        .select('*', { count: 'exact' });

    if (reportedPostsError) {
        console.log('X Table "reported_posts" error:', reportedPostsError.message);
    } else {
        console.log('✓ Table "reported_posts" exists, count:', reportedPostsCount);
    }
}

checkReports();
