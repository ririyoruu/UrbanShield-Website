const fs = require('fs');
try {
  const content = fs.readFileSync('create_admin_tables.sql', 'utf16le');
  console.log(content);
} catch (e) {
  console.error(e);
}
