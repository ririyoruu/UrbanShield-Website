const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jphydwbpizcmltrehuyp.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHlkd2JwaXpjbWx0cmVodXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDYyMDQsImV4cCI6MjA3NDY4MjIwNH0.LBscRvA_Y-xKVD27UphJYXr62cmapUMr-yZcgzd4bG8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndUpdateAudienceConstraint() {
  try {
    console.log('🔍 Checking current target audience constraint...');
    
    // First, let's see what the current constraint looks like
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('target_audience')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching announcements:', error);
      return;
    }
    
    console.log('📋 Current target_audience values in database:');
    const uniqueAudiences = [...new Set(announcements?.map(a => a.target_audience).filter(Boolean) || [])];
    console.log('   Values found:', uniqueAudiences);
    
    console.log('\n📝 SQL to update the target audience constraint:');
    console.log(`
-- Drop the existing constraint
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_target_audience_check;

-- Add the new constraint with your desired values
ALTER TABLE announcements 
ADD CONSTRAINT announcements_target_audience_check 
CHECK (
  target_audience = ANY (ARRAY[
    'all'::text,
    'residents'::text, 
    'government'::text,
    'admin'::text
  ])
);

-- Optional: Update existing records that have invalid values
UPDATE announcements 
SET target_audience = 'all' 
WHERE target_audience NOT IN ('all', 'residents', 'government', 'admin');
    `);
    
    console.log('\n💡 To apply these changes:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL commands above');
    console.log('4. Then I\'ll update the UI code');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndUpdateAudienceConstraint();
