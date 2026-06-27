const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function stripBlackBackground(imageBuffer) {
  const { data, info } = await sharp(imageBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < 48 && g < 48 && b < 48) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function buildCircularIcon(sourcePath, canvasSize) {
  const meta = await sharp(sourcePath).metadata();
  const cropSize = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - cropSize) / 2);
  const top = Math.floor((meta.height - cropSize) / 2);
  const symbolSize = Math.floor(canvasSize * 0.88);

  const cropped = await sharp(sourcePath)
    .extract({ left, top, width: cropSize, height: cropSize })
    .resize(symbolSize, symbolSize, { fit: 'cover' })
    .png()
    .toBuffer();

  const symbol = await stripBlackBackground(cropped);

  const circleMask = Buffer.from(
    `<svg width="${canvasSize}" height="${canvasSize}">
      <circle cx="${canvasSize / 2}" cy="${canvasSize / 2}" r="${canvasSize / 2}" fill="white"/>
    </svg>`,
  );

  const borderRing = Buffer.from(
    `<svg width="${canvasSize}" height="${canvasSize}">
      <circle cx="${canvasSize / 2}" cy="${canvasSize / 2}" r="${canvasSize / 2 - 1.5}" fill="none" stroke="#c8c8cc" stroke-width="3"/>
    </svg>`,
  );

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: symbol, gravity: 'center' },
      { input: circleMask, blend: 'dest-in' },
      { input: borderRing },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'img/favicon-source.png');

  if (!fs.existsSync(source)) {
    throw new Error(`Missing favicon source: ${source}`);
  }

  const circularBase = await buildCircularIcon(source, 512);

  const masterPath = path.join(root, 'img/favicon.png');
  await sharp(circularBase).png().toFile(masterPath);
  console.log('built', path.relative(root, masterPath));

  const outputs = [
    { output: path.join(root, 'apps/web/public/favicon.png'), size: 48 },
    { output: path.join(root, 'apps/web/public/favicon-32.png'), size: 32 },
    { output: path.join(root, 'apps/web/public/apple-icon.png'), size: 180 },
    { output: path.join(root, 'apps/web/src/app/icon.png'), size: 48 },
    { output: path.join(root, 'apps/web/src/app/apple-icon.png'), size: 180 },
  ];

  for (const { output, size } of outputs) {
    await sharp(circularBase).resize(size, size, { kernel: sharp.kernel.lanczos3 }).png().toFile(output);
    console.log('synced', path.relative(root, output));
  }

  console.log('icon sync complete');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
