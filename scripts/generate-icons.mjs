import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Vansh Logo-Photoroom.png');
const OUT_DIR = path.join(ROOT, 'packages/web/public/icons');
const PUBLIC_DIR = path.join(ROOT, 'packages/web/public');

const BG = '#FAFAF5';

async function loadTrimmedLogo() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = data[i + 3];
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const isWhite = r > 240 && g > 240 && b > 240;
      if (a > 10 && !isWhite) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return sharp(SRC).toBuffer();
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return sharp(SRC).extract({ left: minX, top: minY, width: w, height: h }).toBuffer();
}

async function makeSquare(size, padRatio = 0.08) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const trimmed = await loadTrimmedLogo();
  const logo = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function makeMaskable(size) {
  const inner = Math.round(size * 0.64);
  const trimmed = await loadTrimmedLogo();
  const logo = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function makeStartupImage(width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.45);
  const trimmed = await loadTrimmedLogo();
  const logo = await sharp(trimmed)
    .resize({ width: logoSize, height: logoSize, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

const IPHONE_SPLASH_SIZES = [
  { w: 1290, h: 2796 },
  { w: 1179, h: 2556 },
  { w: 1170, h: 2532 },
  { w: 1284, h: 2778 },
  { w: 1125, h: 2436 },
  { w: 1242, h: 2688 },
  { w: 828, h: 1792 },
  { w: 750, h: 1334 },
  { w: 640, h: 1136 },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const SPLASH_DIR = path.join(PUBLIC_DIR, 'splash');
  fs.mkdirSync(SPLASH_DIR, { recursive: true });

  const icon192 = await makeSquare(192);
  const icon512 = await makeSquare(512);
  const apple180 = await makeSquare(180, 0.08);
  const maskable512 = await makeMaskable(512);
  const favicon32 = await makeSquare(32, 0.06);
  const splashLogoRaw = await makeSquare(160, 0.05);
  const splashLogo = await sharp(splashLogoRaw)
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();

  fs.writeFileSync(path.join(OUT_DIR, 'icon-192x192.png'), icon192);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-512x512.png'), icon512);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-maskable-512x512.png'), maskable512);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), apple180);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'splash-logo.png'), splashLogo);

  for (const { w, h } of IPHONE_SPLASH_SIZES) {
    const buf = await makeStartupImage(w, h);
    fs.writeFileSync(path.join(SPLASH_DIR, `splash-${w}x${h}.png`), buf);
  }

  const splashLogoBase64 = splashLogo.toString('base64');
  fs.writeFileSync(
    path.join(ROOT, 'scripts/splash-logo.base64.txt'),
    splashLogoBase64
  );

  console.log('Generated icons in', OUT_DIR);
  console.log('Generated', IPHONE_SPLASH_SIZES.length, 'iPhone splash images');
  console.log('splash-logo.png size:', splashLogo.length, 'bytes');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
