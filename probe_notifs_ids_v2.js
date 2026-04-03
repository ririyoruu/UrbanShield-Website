const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
  console.log('--- Probing notifications table additional ID columns ---');
  const cols = ['external_id', 'ref_id', 'object_id', 'source_id', 'link'];
  for (const c of cols) {
    try {
      const { error } = await supabase.from('notifications').select(c).limit(1);
      if (error && error.code === '42703') {
        console.log(`❌ ${c}: NO`);
      } else {
        console.log(`✅ ${c}: YES`);
      }
    } catch (e) {}
  }
}

probe();
