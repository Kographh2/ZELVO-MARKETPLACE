import satori from 'satori';
import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { SITE, DEVELOPERS, GAME } from './constants';
import { rupiah, dateID, maskAccount } from './format';

let fontCache: any[] | null = null;
function fonts() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), 'assets', 'fonts');
  const rd = (f: string) => fs.readFileSync(path.join(dir, f));
  fontCache = [
    { name: 'Unbounded', data: rd('unbounded-700.woff'), weight: 700, style: 'normal' },
    { name: 'Jakarta', data: rd('jakarta-500.woff'), weight: 500, style: 'normal' },
    { name: 'Jakarta', data: rd('jakarta-700.woff'), weight: 700, style: 'normal' },
  ];
  return fontCache;
}

async function render(el: any, width: number, height: number): Promise<Buffer> {
  const svg = await satori(el, { width, height, fonts: fonts() as any });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export const qrDataUrl = (text: string, dark = '#0a1a44', width = 420) =>
  QRCode.toDataURL(text, { width, margin: 1, errorCorrectionLevel: 'M', color: { dark, light: '#ffffff' } });

const host = () => SITE.url.replace(/^https?:\/\//, '');

/* ─────────── Watermark + thumbnail ─────────── */
function watermarkSvg(size: number) {
  const label = `Preview • file asli didapat setelah install di ${host()}`.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
  const rows: string[] = [];
  for (let i = 0; i < 16; i++) {
    const y = -260 + i * 94;
    const words: string[] = [];
    for (let j = 0; j < 10; j++) words.push(`<text x="${-260 + j * 200 + (i % 2 ? 100 : 0)}" y="${y}">ZELVO</text>`);
    rows.push(`<g fill="${i % 2 ? '#0a1a44' : '#ffffff'}" fill-opacity="${i % 2 ? 0.34 : 0.62}">${words.join('')}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700"><g transform="rotate(-28 ${size / 2} ${size / 2})">${rows.join('')}</g><text x="${size / 2}" y="${size - 18}" text-anchor="middle" font-size="22" fill="rgba(10,26,68,0.75)">${label}</text></g></svg>`;
}

/** PNG transparan asli → JPEG ber-watermark (tidak bisa dipakai ulang sebagai template). */
export async function makeThumbnail(original: Buffer): Promise<Buffer> {
  const size = 900;
  const tpl = await sharp(original).resize(780, 780, { fit: 'inside' }).png().toBuffer();
  const wm = await sharp(Buffer.from(watermarkSvg(size))).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 196, g: 202, b: 217, alpha: 1 } } })
    .composite([{ input: tpl, gravity: 'centre' }, { input: wm, top: 0, left: 0 }])
    .flatten({ background: '#c4cad9' })
    .jpeg({ quality: 82 })
    .toBuffer();
}

/* ─────────── Gambar share ─────────── */
export async function renderShareImage(p: {
  title: string; store: string; motor?: string; style?: string; price: number;
  installs: number; rating: number; ratingCount: number; thumbDataUrl: string; url: string; format: 'feed' | 'story';
}) {
  const W = 1080, H = p.format === 'story' ? 1920 : 1350;
  const thumb = p.format === 'story' ? 880 : 600;
  const qr = await qrDataUrl(p.url, '#05070d', 360);
  const title = p.title.length > 56 ? p.title.slice(0, 54) + '…' : p.title;
  const chip = (t: string, k: string) => (
    <div key={k} style={{ display: 'flex', border: '2px solid #1d2a54', color: '#8a97bd', fontSize: 26, padding: '8px 18px', fontFamily: 'Jakarta', fontWeight: 700 }}>{t}</div>
  );
  const el = (
    <div style={{ display: 'flex', flexDirection: 'column', width: W, height: H, background: '#05070d', color: '#e8edfb', fontFamily: 'Jakarta', padding: 64, position: 'relative', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', position: 'absolute', top: 0, width: 360, height: H, background: '#0b1020', transform: 'skewX(-12deg)', right: -120 }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 44, color: '#2d6bff' }}>ZELVO</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#8a97bd' }}>Template striping {GAME.name}</div>
        </div>
        <div style={{ display: 'flex', marginTop: 40, alignSelf: 'center', border: '2px solid #2d6bff', padding: 14, background: '#c4cad9' }}>
          <img src={p.thumbDataUrl} width={thumb} height={thumb} />
        </div>
        <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: p.format === 'story' ? 54 : 44, lineHeight: 1.25, marginTop: 40 }}>{title}</div>
        <div style={{ display: 'flex', marginTop: 20, gap: 12 }}>
          {p.motor ? chip(p.motor, 'm') : null}
          {p.style ? chip(p.style, 's') : null}
          {chip('oleh ' + p.store, 'st')}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', background: '#2d6bff', color: '#fff', fontFamily: 'Unbounded', fontSize: 44, padding: '14px 28px', alignSelf: 'flex-start' }}>
            {p.price > 0 ? rupiah(p.price) : 'Gratis'}
          </div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 22, color: '#e8edfb' }}>
            {p.installs} install{p.ratingCount > 0 ? `  •  Rating ${p.rating.toFixed(1)} dari 5 (${p.ratingCount})` : ''}
          </div>
          <div style={{ display: 'flex', fontSize: 24, marginTop: 14, color: '#8a97bd' }}>Scan QR atau buka {host()}</div>
          <div style={{ display: 'flex', fontSize: 22, marginTop: 6, color: '#8a97bd' }}>{DEVELOPERS}</div>
        </div>
        <div style={{ display: 'flex', background: '#fff', padding: 14 }}>
          <img src={qr} width={250} height={250} />
        </div>
      </div>
    </div>
  );
  return render(el, W, H);
}

/* ─────────── Bukti saldo penarikan ─────────── */
export async function renderBalanceProof(w: any, seller: any, verifyCode: string) {
  const esc = (v: unknown) => String(v ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
  const cut = (v: unknown, n: number) => { const t = String(v ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const rows: [string, string, boolean][] = [
    ['Toko', seller.store_name || seller.display_name, false],
    ['Username', '@' + seller.username, false],
    ['Saldo yang ditarik', rupiah(w.amount), true],
    ['Bank', w.bank_name, false],
    ['No. rekening', maskAccount(w.account_number, 4), false],
    ['Atas nama', w.account_name, false],
    ['Kode pengajuan', w.code, false],
    ['Dibuat', dateID(w.created_at, true), false],
  ];
  const lines = rows.map(([k, v, big], i) => {
    const y = 280 + i * 76;
    return `<text x="70" y="${y}" font-size="28" fill="#8a97bd">${esc(k)}</text><text x="1010" y="${y}" text-anchor="end" font-size="${big ? 40 : 30}" font-weight="700" fill="${big ? '#6aa0ff' : '#e8edfb'}">${esc(cut(v, 42))}</text><line x1="70" y1="${y + 24}" x2="1010" y2="${y + 24}" stroke="#1d2a54" stroke-width="2"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#05070d"/><g font-family="Arial, Helvetica, sans-serif"><g transform="translate(-160 440) rotate(-24)" opacity="0.07" fill="#2d6bff" font-size="90" font-weight="700">${[0, 1, 2, 3].map((i) => `<text x="${i % 2 ? 160 : 0}" y="${i * 120}">ZELVO ZELVO ZELVO ZELVO</text>`).join('')}</g><text x="70" y="120" font-size="48" font-weight="700" fill="#2d6bff">ZELVO</text><text x="1010" y="112" text-anchor="end" font-size="26" fill="#8a97bd">${esc(host())}</text><text x="70" y="215" font-size="40" font-weight="700" fill="#e8edfb">Bukti saldo penarikan</text>${lines}<rect x="70" y="960" width="940" height="150" fill="none" stroke="#2d6bff" stroke-width="2"/><text x="98" y="1005" font-size="24" fill="#8a97bd">Kode verifikasi (dicek admin di sistem)</text><text x="98" y="1058" font-size="34" font-weight="700" fill="#e8edfb">${esc(verifyCode)}</text><text x="70" y="1170" font-size="22" fill="#8a97bd">Gambar ini dibuat otomatis oleh server ZELVO dari data saldo asli.</text><text x="70" y="1205" font-size="22" fill="#8a97bd">Angka pada gambar yang diubah tidak akan cocok dengan kode verifikasi di database.</text></g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
