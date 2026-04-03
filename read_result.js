const fs = require('fs');
const content = fs.readFileSync('probe_result.txt', 'utf16le');
console.log(content);
