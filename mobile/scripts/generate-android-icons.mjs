import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(process.cwd());
const svgPath = path.join(projectRoot, 'assets', 'icon.svg');
const androidResRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

const densities = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function generateSquareIcon(size, outPath) {
  const buffer = await sharp(svgPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.writeFile(outPath, buffer);
}

async function generateRoundIcon(size, outPath) {
  const square = await sharp(svgPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
       <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/>
     </svg>`
  );

  const rounded = await sharp(square)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
  await fs.writeFile(outPath, rounded);
}

async function main() {
  try {
    await fs.access(svgPath);
  } catch {
    console.error(`Missing input SVG at ${svgPath}`);
    process.exit(1);
  }

  for (const { dir, size } of densities) {
    const outDir = path.join(androidResRoot, dir);
    await ensureDir(outDir);

    const squareOut = path.join(outDir, 'ic_mindclear.png');
    const roundOut = path.join(outDir, 'ic_mindclear_round.png');

    await generateSquareIcon(size, squareOut);
    await generateRoundIcon(size, roundOut);

    console.log(`Generated ${dir}: ${size}x${size}`);
  }

  console.log('Android Mind Clear launcher icons generated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
