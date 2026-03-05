const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  try {
    console.log('🔍 Checking profiles table structure...');
    
    // Get a sample profile to see the actual columns
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Profile table structure:');
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('📋 No profiles found in table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProfilesTable();
