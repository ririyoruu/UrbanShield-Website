
function parsePostGISLocation(hex) {
    try {
      if (!hex || typeof hex !== 'string') return null;
      const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
      console.log('CLEAN:', clean);
      
      // Determine offset based on WKB header
      let offset = -1;
      if (clean.startsWith('0101000020E6100000')) {
        offset = 18; // EWKB SRID 4326
        console.log('TYPE: EWKB. Offset 18.');
      } else if (clean.startsWith('01010000')) {
        offset = 8; // Standard WKB Point (1 byte order + 4 bytes type = 5 bytes = 10 hex, but let's see)
        // Wait! 01 01 00 00 00 = 5 bytes = 10 chars.
        if (clean.substring(0, 10) === '0101000000') offset = 10;
        else offset = 10; // Try 10 anyway
        console.log('TYPE: WKB. Offset 10.');
      }
      
      if (offset < 0 || clean.length < offset + 32) {
         console.log('LEN CHECK FAIL:', clean.length, '<', offset + 32);
         return null;
      }
      
      const readLE = (h) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        for (let i = 0; i < 8; i++) {
          const byte = parseInt(h.substring(i * 2, i * 2 + 2), 16);
          dv.setUint8(i, byte);
          // console.log(`SET BYTE ${i}: ${byte}`);
        }
        return dv.getFloat64(0, true);
      };
      
      const x = readLE(clean.substring(offset, offset + 16));
      const y = readLE(clean.substring(offset + 16, offset + 32));
      
      console.log('PARSED:', { x, y });
      
      if (y >= -90 && y <= 90 && x >= -180 && x <= 180) return { lat: y, lng: x };
      if (x >= -90 && x <= 90 && y >= -180 && y <= 180) return { lat: x, lng: y };
    } catch (e) {
      console.error('PARSE_ERROR:', e);
    }
    return null;
}

// TEST WITH MY SAMPLE FROM DATABASE
const sample = '010100000052B34B9C69035F40003780D21B192440'; // Sample starts with 0101000000
console.log('RESULT:', parsePostGISLocation(sample));
