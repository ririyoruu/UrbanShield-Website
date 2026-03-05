const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminVerification() {
  try {
    console.log('🔧 Fixing admin user verification status...');
    
    // Get all admin users that are not properly verified
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, is_verified, verification_status')
      .eq('user_type', 'admin');
    
    if (error) {
      console.error('❌ Error fetching admin users:', error);
      return;
    }
    
    console.log(`📋 Found ${adminUsers.length} admin users`);
    
    for (const admin of adminUsers) {
      console.log(`\n👤 Processing admin: ${admin.full_name}`);
      console.log(`   Current: is_verified=${admin.is_verified}, verification_status=${admin.verification_status}`);
      
      // Check if admin needs to be auto-approved
      if (admin.is_verified !== true || admin.verification_status !== 'verified') {
        console.log('   🔧 Auto-approving admin user...');
        
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            is_verified: true,
            verification_status: 'verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', admin.id)
          .select('id, is_verified, verification_status, updated_at');
        
        if (updateError) {
          console.error(`   ❌ Error updating admin ${admin.full_name}:`, updateError);
        } else {
          console.log('   ✅ Admin auto-approved successfully!');
          console.log(`   📋 Updated: is_verified=${data[0].is_verified}, verification_status=${data[0].verification_status}`);
        }
      } else {
        console.log('   ✅ Admin already properly verified');
      }
    }
    
    // Also fix any inconsistent data
    console.log('\n🔧 Checking for inconsistent verification data...');
    
    const { data: inconsistentUsers, error: inconsistentError } = await supabase
      .from('profiles')
      .select('id, full_name, is_verified, verification_status')
      .or('is_verified.null,verification_status.null')
      .limit(10);
    
    if (inconsistentError) {
      console.error('❌ Error checking inconsistent data:', inconsistentError);
    } else if (inconsistentUsers.length > 0) {
      console.log('📋 Found inconsistent verification data:');
      inconsistentUsers.forEach(user => {
        console.log(`   ${user.full_name}: is_verified=${user.is_verified}, verification_status=${user.verification_status}`);
      });
    } else {
      console.log('✅ No inconsistent verification data found');
    }
    
    console.log('\n🎉 Admin verification fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminVerification();
