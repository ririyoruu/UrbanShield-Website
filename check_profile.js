const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://efiswsdjscypiujrvawp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo');
supabase.from('profiles').select('*').not('verification_documents', 'is', null).limit(1).then(({data}) => require('fs').writeFileSync('profile_output.txt', JSON.stringify(data[0], null, 2)));
