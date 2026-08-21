const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'mobile-app', 'assets');

// Ensure assets folder exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent PNG base64 representation
const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(tinyPngBase64, 'base64');

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, imageBuffer);
  console.log(`Created mock asset: ${file}`);
});
