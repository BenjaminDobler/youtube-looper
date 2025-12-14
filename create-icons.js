// Simple script to create PNG icons without external dependencies
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - YouTube blue
  ctx.fillStyle = '#065fd4';
  ctx.fillRect(0, 0, size, size);
  
  // Draw loop symbol (circular arrows)
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  
  // Draw circle
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(2, size / 16);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw top arrow
  const arrowSize = size / 8;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - ctx.lineWidth);
  ctx.lineTo(centerX - arrowSize / 2, centerY - radius + arrowSize);
  ctx.lineTo(centerX + arrowSize / 2, centerY - radius + arrowSize);
  ctx.closePath();
  ctx.fill();
  
  // Draw bottom arrow (rotated)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + radius + ctx.lineWidth);
  ctx.lineTo(centerX - arrowSize / 2, centerY + radius - arrowSize);
  ctx.lineTo(centerX + arrowSize / 2, centerY + radius - arrowSize);
  ctx.closePath();
  ctx.fill();
  
  // Add "L" text for Loop
  if (size >= 48) {
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L', centerX, centerY);
  }
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

try {
  const iconsDir = __dirname + '/icons';
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
  }
  
  createIcon(16, iconsDir + '/icon16.png');
  createIcon(48, iconsDir + '/icon48.png');
  createIcon(128, iconsDir + '/icon128.png');
  
  console.log('All icons created successfully!');
} catch (error) {
  console.error('Error creating icons:', error.message);
  console.log('Canvas module not available. Using fallback method...');
  process.exit(1);
}
