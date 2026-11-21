import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { makeThumbnail } from './lib/imaging';

async function main() {
  const sample = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect x="212" y="212" width="600" height="600" rx="60" fill="#1f6feb"/><circle cx="512" cy="400" r="140" fill="#ffd166"/><text x="512" y="700" font-family="Arial" font-size="72" font-weight="700" text-anchor="middle" fill="#ffffff">MOTIF</text></svg>`;
  const png = await sharp(Buffer.from(sample)).png().toBuffer();
  const jpg = await makeThumbnail(png);
  const out = path.join(process.cwd(), '.thumb-test.jpg');
  fs.writeFileSync(out, jpg);
  const meta = await sharp(jpg).metadata();
  console.log({ out, format: meta.format, width: meta.width, height: meta.height, bytes: jpg.length });
}
main();
