const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://efiswsdjscypiujrvawp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function probeConstraints() {
  const { error } = await supabase.from('profiles').update({ user_type: 'ghost' }).eq('email', 'ririyoru@gmail.com');
  console.log('Error message:', error.message);
}
probeConstraints();
