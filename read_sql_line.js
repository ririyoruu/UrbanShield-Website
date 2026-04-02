const fs = require('fs');
const content = fs.readFileSync('create_admin_tables.sql', 'utf16le');
console.log(content.split('\n').filter(l => l.includes('admin_profiles')).join('\n'));
