const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYwOTgxNCwiZXhwIjoyMDkwMTg1ODE0fQ.AKKK5NOjJpT3oYkoVkAIUfR_lq38bYpegVnEfQBqtaQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const adminEmail = 'urbanshield.ad@gmail.com';
const newPassword = 'SuperAdminPassword123!';

async function resetPassword() {
    console.log(`Resetting password for ${adminEmail}...`);
    
    // Get user ID first
    const { data: userData, error: listError } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === adminEmail);
    
    if (!user) {
        console.error('User not found in auth.users');
        return;
    }
    
    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );
    
    if (error) {
        console.error('Error resetting password:', error.message);
    } else {
        console.log('Password successfully reset to:', newPassword);
    }
}

resetPassword();
