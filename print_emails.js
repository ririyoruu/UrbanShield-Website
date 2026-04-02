const fs = require('fs');
const content = fs.readFileSync('users_dump.json', 'utf16le');
const lines = content.split('\n');
lines.forEach(line => {
  if (line.includes('"email":')) {
    console.log(line.trim());
  }
});
