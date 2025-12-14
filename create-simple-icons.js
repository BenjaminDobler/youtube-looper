// Create simple solid color PNG icons without external dependencies
const fs = require('fs');
const path = require('path');

// Minimal PNG file structure for a solid color square
function createSimplePNG(size, r, g, b) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (image header)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData.writeUInt8(8, 8);        // bit depth
  ihdrData.writeUInt8(2, 9);        // color type (RGB)
  ihdrData.writeUInt8(0, 10);       // compression
  ihdrData.writeUInt8(0, 11);       // filter
  ihdrData.writeUInt8(0, 12);       // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // Create image data (uncompressed for simplicity, with filter byte)
  const rowSize = size * 3 + 1; // RGB + filter byte
  const imageDataRaw = Buffer.alloc(size * rowSize);
  
  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    imageDataRaw[rowStart] = 0; // filter type: none
    
    for (let x = 0; x < size; x++) {
      const pixelStart = rowStart + 1 + (x * 3);
      imageDataRaw[pixelStart] = r;
      imageDataRaw[pixelStart + 1] = g;
      imageDataRaw[pixelStart + 2] = b;
    }
  }
  
  // Compress using zlib (node built-in)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageDataRaw);
  
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk (end of file)
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCRC(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function calculateCRC(buf) {
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create icons with YouTube blue color (#065fd4 = RGB 6, 95, 212)
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const png = createSimplePNG(size, 6, 95, 212);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`✅ Created ${filename} (${png.length} bytes)`);
});

console.log('\n🎉 All icons created successfully!');
