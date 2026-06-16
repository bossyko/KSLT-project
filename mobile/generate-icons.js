const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SVG = path.join(__dirname, 'icons/variant-1-ball.svg');
const RES = path.join(__dirname, 'android/app/src/main/res');

// Android mipmap sizes
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground sizes (adaptive icon, 108dp with safe zone)
const fgSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generate() {
  const svgBuffer = fs.readFileSync(SVG);

  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(RES, folder);

    // ic_launcher.png — standard icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png — round icon (clip to circle)
    const circle = Buffer.from(
      `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .composite([{ input: circle, blend: 'dest-in' }])
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`✓ ${folder}: ${size}x${size}`);
  }

  // Foreground for adaptive icons
  for (const [folder, size] of Object.entries(fgSizes)) {
    const dir = path.join(RES, folder);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ ${folder} foreground: ${size}x${size}`);
  }

  // Also generate 512x512 for Play Store / website
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'icons/kslt-icon-512.png'));
  console.log('✓ 512x512 (store/web)');

  // 1024x1024 for future use
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(__dirname, 'icons/kslt-icon-1024.png'));
  console.log('✓ 1024x1024');

  console.log('\nDone! All icons generated.');
}

generate().catch(console.error);
