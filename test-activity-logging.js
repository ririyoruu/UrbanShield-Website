const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActivityLogging() {
  try {
    console.log('🧪 Testing activity logging for user verification...');
    
    // First, let's try to create an activity log entry directly
    const adminId = '25df1a57-852e-4c02-8e24-f62789ff70da'; // Admin user ID
    
    console.log('🔧 Creating test activity log entry...');
    
    const { data, error } = await supabase
      .from('activity_log')
      .insert([{
        user_id: adminId,
        activity_type: 'verification',
        activity_description: 'Test: User verification approved for test user',
        related_incident_id: null
      }])
      .select(`
        *,
        user: user_id (
          full_name,
          email,
          user_type
        )
      `);
    
    if (error) {
      console.error('❌ Error creating activity log:', error);
      
      if (error.code === '42501') {
        console.log('💡 This confirms RLS policy is blocking anonymous access');
        console.log('🔧 Activity logging will work when:');
        console.log('   1. Admin user is logged in to the app');
        console.log('   2. The app uses the authenticated user session');
        console.log('   3. RLS policy allows authenticated admins to insert logs');
      }
      return;
    }
    
    console.log('✅ Activity log created successfully!');
    console.log('📋 Log entry:', data[0]);
    
    // Now let's fetch all activity logs to see if it appears
    console.log('\n🔍 Fetching updated activity logs...');
    const { data: logs, error: fetchError } = await supabase
      .from('activity_log')
      .select(`
        *,
        user: user_id (
          full_name,
          email,
          user_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching logs:', fetchError);
    } else {
      console.log('📋 Recent activity logs:');
      logs.forEach((log, idx) => {
        console.log(`\n${idx + 1}. ${log.user?.full_name || 'Unknown User'} (${log.user?.user_type || 'N/A'})`);
        console.log(`   Action: ${log.activity_description}`);
        console.log(`   Type: ${log.activity_type}`);
        console.log(`   Created: ${log.created_at}`);
      });
    }
    
    console.log('\n🎉 Activity logging test completed!');
    console.log('💡 The audit log will now show verification actions when:');
    console.log('   1. Admin users are logged into the application');
    console.log('   2. User verification actions are performed');
    console.log('   3. The app uses proper authentication context');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActivityLogging();
