const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the updateUserVerification function
async function updateUserVerification(userId, isVerified, verificationStatus = null) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Determine verification_status based on isVerified if not explicitly provided
    let status = verificationStatus;
    if (!status) {
      status = isVerified ? 'verified' : 'pending';
    }
    
    // Update both is_verified (boolean) and verification_status (text)
    const updateData = { 
      is_verified: isVerified,
      verification_status: status,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔧 Updating user verification:', { userId, updateData });
    
    // Update profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('❌ Error in updateUserVerification:', error);
    throw error;
  }
}

async function testVerificationProcess() {
  try {
    console.log('🧪 Testing verification process...');
    
    // Get a pending user to test with
    const { data: pendingUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, is_verified, verification_status')
      .eq('verification_status', 'pending')
      .neq('user_type', 'admin') // Skip admins since they're auto-approved
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching pending users:', error);
      return;
    }
    
    if (!pendingUsers || pendingUsers.length === 0) {
      console.log('📋 No pending users found to test with');
      
      // Let's test with a government user that's pending
      const { data: govUsers, error: govError } = await supabase
        .from('profiles')
        .select('id, full_name, email, user_type, is_verified, verification_status')
        .eq('user_type', 'government')
        .eq('verification_status', 'pending')
        .limit(1);
      
      if (govError) {
        console.error('❌ Error fetching government users:', govError);
        return;
      }
      
      if (!govUsers || govUsers.length === 0) {
        console.log('📋 No pending government users found either');
        return;
      }
      
      pendingUsers.push(...govUsers);
    }
    
    const testUser = pendingUsers[0];
    console.log('👤 Testing with user:', testUser);
    
    // Test approval
    console.log('\n🔧 Testing approval...');
    const result = await updateUserVerification(testUser.id, true, 'verified');
    console.log('✅ Approval result:', result[0]);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('is_verified, verification_status, updated_at')
      .eq('id', testUser.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('🔍 Verification check:', verifyData);
      console.log('✅ Verification process working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('💡 This might be an RLS (Row Level Security) issue');
    console.error('💡 Try logging in as an admin user in the app and then verify');
  }
}

testVerificationProcess();
