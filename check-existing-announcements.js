const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingAnnouncements() {
  try {
    console.log('🔍 Checking existing announcements with new schema...');
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching announcements:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📋 No announcements found in the table');
      return;
    }
    
    console.log(`📋 Found ${data.length} announcements:`);
    data.forEach((ann, idx) => {
      console.log(`\n${idx + 1}. ${ann.title}`);
      console.log(`   ID: ${ann.id}`);
      console.log(`   Priority: ${ann.priority || 'N/A'}`);
      console.log(`   Target Audience: ${ann.target_audience || 'N/A'}`);
      console.log(`   Expires At: ${ann.expires_at || 'No expiration'}`);
      console.log(`   Created: ${ann.created_at}`);
      console.log(`   Updated: ${ann.updated_at}`);
      console.log(`   Author: ${ann.author_name || 'N/A'} (${ann.author_type || 'N/A'})`);
      console.log(`   Is Pinned: ${ann.is_pinned || false}`);
      
      // Check for schema compliance
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      const validAudiences = ['all', 'residents', 'business', 'government', 'tourists', 'parents'];
      
      if (ann.priority && !validPriorities.includes(ann.priority)) {
        console.log(`   ⚠️  Invalid priority: ${ann.priority}`);
      }
      
      if (ann.target_audience && !validAudiences.includes(ann.target_audience)) {
        console.log(`   ⚠️  Invalid target_audience: ${ann.target_audience}`);
      }
    });
    
    console.log('\n✅ Schema check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExistingAnnouncements();
