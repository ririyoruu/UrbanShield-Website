const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActivityLogTable() {
  try {
    console.log('🔍 Checking for activity_log table...');
    
    // Try to fetch from activity_log table
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing activity_log table:', error);
      console.log('💡 No existing audit log table found');
    } else {
      console.log('✅ activity_log table exists. Sample data:', data);
      console.log('📋 Table structure:', Object.keys(data[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkActivityLogTable();
