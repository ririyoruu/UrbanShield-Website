const fs = require('fs');
const files = ['create_admin_tables.sql', 'create_admin_tables_utf8.sql'];

for (const f of files) {
  try {
    const data = fs.readFileSync(f);
    console.log(`--- File: ${f} ---`);
    console.log(data.toString('utf-8').substring(0, 500));
    console.log('\n');
  } catch (e) {
    console.log(`Error reading ${f}: ${e.message}`);
  }
}
