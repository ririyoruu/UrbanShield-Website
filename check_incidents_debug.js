const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

// Try to find Supabase credentials from common locations if not in process.env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vszfipmxjzkisoyzshjr.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials. Checking config folder...');
}

// Just a quick check of the last 5 incidents
async function checkIncidents() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('incidents')
    .select('id, title, latitude, longitude, location, address')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching incidents:', error);
    return;
  }

  console.log('--- Last 5 Incidents Location Data ---');
  data.forEach(inc => {
    console.log(`ID: ${inc.id}`);
    console.log(`Title: ${inc.title}`);
    console.log(`Lat: ${inc.latitude}`);
    console.log(`Lng: ${inc.longitude}`);
    console.log(`Hex Location: ${inc.location?.substring(0, 20)}...`);
    console.log(`Address: ${inc.address}`);
    console.log('-----------------------------------');
  });
}

checkIncidents();
