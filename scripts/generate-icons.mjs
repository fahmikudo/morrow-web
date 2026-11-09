import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const ACCENT = '#0369A1';
const source = await readFile('public/icons/icon.svg');

await mkdir('public/icons', { recursive: true });

const render = async (size) => sharp(source).resize(size, size).png().toBuffer();

await writeFile('public/icons/icon-192.png', await render(192));
await writeFile('public/icons/icon-512.png', await render(512));
await writeFile('public/icons/apple-touch-icon.png', await render(180));

const inner = await sharp(source)
  .resize(Math.round(512 * 0.6))
  .png()
  .toBuffer();

const maskable = await sharp({
  create: { width: 512, height: 512, channels: 4, background: ACCENT },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toBuffer();

await writeFile('public/icons/icon-maskable-512.png', maskable);

console.log('Generated icons: icon-192, icon-512, icon-maskable-512, apple-touch-icon');
