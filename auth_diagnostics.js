const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostics() {
    console.log('--- Auth Diagnostics ---');
    
    // Test connection
    const { data: serverTime, error: timeError } = await supabase.rpc('get_server_time');
    // If rpc not found, try simple select
    const { data: testData, error: testError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (testError) {
        console.error('❌ Connection/Table Error:', testError.message, 'Code:', testError.code);
    } else {
        console.log('✅ Connection to profiles table OK.');
    }

    // Try selecting columns including verification_status
    console.log('--- Testing Column Selection ---');
    const { data: colsData, error: colsError } = await supabase
        .from('profiles')
        .select('user_type, verification_status, email, full_name')
        .limit(1);

    if (colsError) {
        console.error('❌ Column Error at line 263 equivalent:', colsError.message, 'Code:', colsError.code);
    } else {
        console.log('✅ Select statement OK.');
    }

    // Checking triggers or RLS by trying to update something with service role if we had it, but we only have anon.
    // Let's check for any existing known admin user.
    const knownAdminId = '75761622-af1d-49c6-8c48-d3dad6941241';
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, verification_status, email, full_name')
        .eq('id', knownAdminId)
        .single();

    if (profileError) {
        console.error('❌ Profile Fetch Error:', profileError.message, 'Code:', profileError.code);
    } else {
        console.log('✅ Specific Profile Fetch OK:', profile.email);
        console.log('Profile details:', JSON.stringify(profile, null, 2));
    }

    // Check invitation_codes table
    console.log('--- Checking invitation_codes Table ---');
    const { data: invData, error: invError } = await supabase.from('invitation_codes').select('*').limit(1);
    if (invError) {
        console.error('❌ invitation_codes Error:', invError.message, 'Code:', invError.code);
    } else {
        console.log('✅ invitation_codes is accessible.');
    }

    // Check admin_profiles table
    console.log('--- Checking admin_profiles Table ---');
    const { data: admData, error: admError } = await supabase.from('admin_profiles').select('*').limit(1);
    if (admError) {
        console.error('❌ admin_profiles Error:', admError.message, 'Code:', admError.code);
    } else {
        console.log('✅ admin_profiles is accessible.');
    }
}

diagnostics();
