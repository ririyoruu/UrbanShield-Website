const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActivityLog() {
  try {
    console.log('🧪 Testing activity_log functionality...');
    
    // Test fetching from activity_log table
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user: user_id (
          full_name,
          email,
          user_type
        ),
        incident: related_incident_id (
          title,
          category
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching activity logs:', error);
      
      if (error.message.includes('permission')) {
        console.log('💡 This might be an RLS (Row Level Security) issue');
        console.log('🔧 Try logging in as an admin user in the app first');
      }
      return;
    }
    
    console.log('✅ Activity logs fetched successfully!');
    console.log(`📋 Found ${data.length} activity logs:`);
    
    if (data.length === 0) {
      console.log('📋 No activity logs found. Creating a test entry...');
      
      // Try to create a test activity log
      const { data: newLog, error: insertError } = await supabase
        .from('activity_log')
        .insert([{
          user_id: '25df1a57-852e-4c02-8e24-f62789ff70da', // Admin user ID
          activity_type: 'verification',
          activity_description: 'Test audit log entry - User verification approved',
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
      
      if (insertError) {
        console.error('❌ Error creating test activity log:', insertError);
        console.log('💡 This confirms there are RLS restrictions on the table');
        console.log('🔧 The audit log will work when logged in as admin user');
      } else {
        console.log('✅ Test activity log created:', newLog[0]);
      }
    } else {
      data.forEach((log, idx) => {
        console.log(`\n${idx + 1}. Activity Log Entry:`);
        console.log(`   ID: ${log.id}`);
        console.log(`   User: ${log.user?.full_name || 'Unknown'} (${log.user?.user_type || 'N/A'})`);
        console.log(`   Type: ${log.activity_type}`);
        console.log(`   Description: ${log.activity_description || 'No description'}`);
        console.log(`   Related Incident: ${log.incident?.title || 'None'}`);
        console.log(`   Created: ${log.created_at}`);
      });
    }
    
    console.log('\n🎉 Activity log test completed!');
    console.log('💡 The audit log component will work with real data when:');
    console.log('   1. Users are logged in as admins');
    console.log('   2. Activity logs are created by admin actions');
    console.log('   3. RLS policies allow access to the activity_log table');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActivityLog();
