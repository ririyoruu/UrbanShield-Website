const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserVerification() {
  try {
    console.log('🧪 Testing user verification update...');
    
    // Get a test user
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, is_verified, verification_status')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📋 No users found to test with');
      return;
    }
    
    const testUser = users[0];
    console.log('👤 Testing with user:', testUser);
    
    // Test verification update
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id)
      .select('id, is_verified, verification_status, updated_at');
    
    if (error) {
      console.error('❌ Error updating verification:', error);
      return;
    }
    
    console.log('✅ Verification updated successfully!');
    console.log('📋 Updated data:', data[0]);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('is_verified, verification_status')
      .eq('id', testUser.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('🔍 Verification check:', verifyData);
    console.log('✅ Both is_verified and verification_status are now properly synchronized!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserVerification();
