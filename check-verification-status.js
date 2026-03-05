const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationStatus() {
  try {
    console.log('🔍 Checking current verification status...');
    
    // Get all users and their verification status
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, is_verified, verification_status, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log('📋 Recent users and their verification status:');
    users.forEach(user => {
      console.log(`\n👤 ${user.full_name} (${user.email})`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   is_verified: ${user.is_verified}`);
      console.log(`   verification_status: ${user.verification_status}`);
      console.log(`   Last updated: ${user.updated_at}`);
      console.log(`   Created: ${user.created_at}`);
      
      // Check if admin should be auto-approved
      if (user.user_type === 'admin') {
        if (user.is_verified === true && user.verification_status === 'verified') {
          console.log('   ✅ Admin is properly verified');
        } else {
          console.log('   ⚠️  Admin should be auto-approved but is not verified!');
        }
      }
    });
    
    // Check for any recent verification attempts
    console.log('\n🔍 Checking for recent verification updates...');
    const recentTime = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
    
    const recentUpdates = users.filter(user => 
      new Date(user.updated_at) > recentTime
    );
    
    if (recentUpdates.length > 0) {
      console.log('📝 Recent verification updates:');
      recentUpdates.forEach(user => {
        console.log(`   ${user.full_name}: Updated ${user.updated_at}`);
      });
    } else {
      console.log('📝 No recent verification updates found in the last 5 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVerificationStatus();
