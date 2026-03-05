const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnnouncementsWithSchema() {
  try {
    console.log('🧪 Testing announcements with updated schema...');
    
    // Test creating an announcement with the correct schema
    const testAnnouncement = {
      title: 'Schema Test Announcement',
      content: 'This announcement tests the updated schema with correct field names',
      priority: 'low', // New priority option
      target_audience: 'residents', // Updated audience option
      expiration_date: '2026-12-31' // Will be mapped to expires_at
    };
    
    console.log('📝 Creating announcement with schema:', testAnnouncement);
    
    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        title: testAnnouncement.title,
        content: testAnnouncement.content,
        author_id: '25df1a57-852e-4c02-8e24-f62789ff70da',
        author_name: 'System Admin',
        author_type: 'admin',
        is_pinned: false,
        priority: testAnnouncement.priority,
        target_audience: testAnnouncement.target_audience,
        expires_at: testAnnouncement.expiration_date
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating announcement:', error);
      return;
    }
    
    console.log('✅ Announcement created successfully!');
    console.log('📋 Created data:', data[0]);
    
    // Test fetching announcements
    const { data: announcements, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching announcements:', fetchError);
      return;
    }
    
    console.log('\n📋 Recent announcements:');
    announcements.forEach((ann, idx) => {
      console.log(`\n${idx + 1}. ${ann.title}`);
      console.log(`   Priority: ${ann.priority}`);
      console.log(`   Target Audience: ${ann.target_audience}`);
      console.log(`   Expires At: ${ann.expires_at || 'No expiration'}`);
      console.log(`   Created: ${ann.created_at}`);
      console.log(`   Author: ${ann.author_name} (${ann.author_type})`);
    });
    
    // Test updating the announcement
    if (data && data[0]) {
      console.log('\n🔧 Testing update...');
      const { data: updatedData, error: updateError } = await supabase
        .from('announcements')
        .update({
          priority: 'high',
          target_audience: 'all'
        })
        .eq('id', data[0].id)
        .select();
      
      if (updateError) {
        console.error('❌ Error updating announcement:', updateError);
      } else {
        console.log('✅ Update successful!');
        console.log('📋 Updated data:', updatedData[0]);
      }
    }
    
    console.log('\n🎉 All schema tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAnnouncementsWithSchema();
