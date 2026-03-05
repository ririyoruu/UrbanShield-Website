const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActivityLoggingWithAuth() {
  try {
    console.log('🧪 Testing activity logging with authentication context...');
    
    // First, let's try to simulate what happens when an admin is logged in
    // We'll create a test activity log with the admin user context
    const adminId = '25df1a57-852e-4c02-8e24-f62789ff70da';
    
    console.log('🔧 Creating activity log with admin context...');
    console.log(`📝 Admin ID: ${adminId}`);
    
    // Try to create an activity log entry
    const { data, error } = await supabase
      .from('activity_log')
      .insert([{
        user_id: adminId,
        activity_type: 'verification',
        activity_description: 'Test: Admin approved user verification',
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
        console.log('💡 RLS Policy Analysis:');
        console.log('   - The activity_log table has RLS enabled');
        console.log('   - Anonymous users cannot create logs');
        console.log('   - Need to check RLS policy for authenticated admins');
        
        console.log('\n🔧 Recommended RLS Policy Update:');
        console.log(`
-- Allow authenticated admins to create activity logs
CREATE POLICY "Admins can insert activity logs" ON activity_log
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Allow authenticated admins to read activity logs  
CREATE POLICY "Admins can view activity logs" ON activity_log
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );
        `);
      }
      return;
    }
    
    console.log('✅ Activity log created successfully!');
    console.log('📋 Log entry:', data[0]);
    
    // Fetch all logs to see the updated list
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
      .limit(3);
    
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
    
    console.log('\n🎉 Test completed!');
    console.log('💡 Next steps:');
    console.log('   1. Update RLS policies if needed');
    console.log('   2. Test activity logging in the app when admin is logged in');
    console.log('   3. Check the Audit Log component for new entries');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActivityLoggingWithAuth();
