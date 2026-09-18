const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Значки сайта: то, что видит человек, когда сохраняет страницу на рабочий стол
// телефона или компьютера. Раньше их не было вовсе, и система подставляла
// favicon.svg — мячик вместо логотипа клуба.
//
// Берём тот же логотип, что и приложение (icons/kslt-icon.svg), чтобы значок
// сайта и значок приложения не расходились.
const SVG = path.join(__dirname, 'icons/kslt-icon.svg');
const SVG_FG = path.join(__dirname, 'icons/kslt-icon-foreground.svg');
const OUT = path.join(__dirname, '../images/icons');

// Android режет maskable-значок по кругу. Логотип широкий, поэтому вписываем
// его в безопасный круг: 80% от стороны, и ещё запас, чтобы углы надписи
// не задевали край.
const SAFE_WIDTH = 380 / 512;

async function maskable(size) {
  const logo = await sharp(SVG_FG)
    .resize(2048, 2048)
    .png()
    .toBuffer()
    .then((buf) => sharp(buf).trim({ threshold: 1 }).toBuffer());

  const width = Math.round(size * SAFE_WIDTH);
  const fitted = await sharp(logo).resize({ width }).png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#0A0A0A',
    },
  })
    .composite([{ input: fitted, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function generate() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const size of [192, 512]) {
    await sharp(SVG)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);

    fs.writeFileSync(path.join(OUT, `icon-${size}-maskable.png`), await maskable(size));
    console.log(`✓ icon-${size}-maskable.png`);
  }

  // iOS сам скругляет углы, поэтому кладём сплошной квадрат без прозрачности.
  await sharp(SVG)
    .resize(180, 180)
    .flatten({ background: '#0A0A0A' })
    .png()
    .toFile(path.join(OUT, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  console.log('\nГотово: значки сайта собраны из логотипа КСЛТ.');
}

generate().catch(console.error);
