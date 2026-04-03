
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://efiswsdjscypiujrvawp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXN3c2Rqc2N5cGl1anJ2YXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDk4MTQsImV4cCI6MjA5MDE4NTgxNH0.WATfKs11i3ViCtC3i0cPNr2FHZGUqk6iP3GLsSgF_mo';

const supabase = createClient(supabaseUrl, supabaseKey);

const announcements = [
    {
        title: 'Typhoon Warning: Signal No. 2',
        content: 'A Typhoon is approaching. Residents in low-lying areas are advised to prepare for possible evacuation. Please secure your homes and stock up on essential supplies.',
        alert_level: 'warning',
        alert_type: 'Weather Advisory',
        areas: 'Panglao & Dauis, Bohol',
        target_audience: 'all',
        action_items: ['Monitor local news', 'Secure loose objects', 'Prepare go-bags'],
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        title: 'Community Health Advisory: Water Safety',
        content: 'Following recent flooding, residents are advised to boil tap water for at least 3 minutes before consumption until further notice.',
        alert_level: 'info',
        alert_type: 'Health Advisory',
        areas: 'Barangay Poblacion',
        target_audience: 'all',
        action_items: ['Boil drinking water', 'Avoid contact with floodwater'],
        is_pinned: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        title: 'Scheduled Road Maintenance',
        content: 'Major road repairs will be conducted along the main highway from Friday midnight until Sunday noon. Expect traffic delays.',
        alert_level: 'notice',
        alert_type: 'Infrastructure',
        areas: 'Main Highway (KM 12-15)',
        target_audience: 'all',
        action_items: ['Plan alternative routes', 'Allow extra travel time'],
        is_pinned: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString()
    }
];

async function seedAnnouncements() {
    console.log('🌱 Seeding fresh announcements...');
    
    for (const ann of announcements) {
        const { data, error } = await supabase
            .from('announcements')
            .insert([ann])
            .select();
            
        if (error) {
            console.error(`❌ Failed to create "${ann.title}":`, error.message);
        } else {
            console.log(`✅ Created: "${ann.title}"`);
        }
    }
    
    console.log('✨ Seeding complete.');
}

seedAnnouncements();
