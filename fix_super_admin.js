const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const adminEmail = 'urbanshield.ad@gmail.com';

async function fixAdmin() {
    console.log(`Fixing admin profile for ${adminEmail}...`);
    
    const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('email', adminEmail)
        .single();
    
    if (findError) {
        console.error('Error finding admin profile:', findError.message);
        return;
    }
    
    console.log(`Found profile: ${profile.id}, current type: ${profile.user_type}`);
    
    const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
            user_type: 'super_admin',
            verification_status: 'verified',
            is_verified: true,
            is_active: true
        })
        .eq('id', profile.id)
        .select();
    
    if (updateError) {
        console.error('Error updating admin profile:', updateError.message);
    } else {
        console.log('Successfully updated admin profile:', JSON.stringify(updateData[0], null, 2));
    }
}

fixAdmin();
