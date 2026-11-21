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

/** Logo ZELVO untuk gambar server (mark Z + teks). */
function Brand({ size }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path d="M17 12H55L50 23H12Z M12 41H50L47 52H9Z" fill="#e8edfb" />
        <path d="M50 23H34L14 41H30Z" fill="#2d6bff" />
      </svg>
      <div style={{ display: 'flex', marginLeft: size * 0.3, fontFamily: 'Unbounded', fontSize: size * 0.8, color: '#e8edfb' }}>ZELVO</div>
    </div>
  );
}

const host = () => SITE.url.replace(/^https?:\/\//, '');

/* ─────────── Watermark + thumbnail ─────────── */
function Watermark({ size }: { size: number }) {
  const rows = Array.from({ length: 12 });
  const cols = Array.from({ length: 6 });
  return (
    <div style={{ display: 'flex', width: size, height: size, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: -size * 0.45, top: -size * 0.45, width: size * 2, height: size * 2, transform: 'rotate(-28deg)' }}>
        {rows.map((_, i) => (
          <div key={i} style={{ display: 'flex', marginBottom: 54, marginLeft: i % 2 ? 150 : 0 }}>
            {cols.map((__, j) => (
              <div key={j} style={{ display: 'flex', marginRight: 70, fontFamily: 'Unbounded', fontSize: 40, color: i % 2 ? 'rgba(10,26,68,0.34)' : 'rgba(255,255,255,0.62)' }}>
                ZELVO
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', position: 'absolute', bottom: 18, left: 0, right: 0, justifyContent: 'center', fontFamily: 'Jakarta', fontWeight: 700, fontSize: 22, color: 'rgba(10,26,68,0.75)' }}>
        Preview • file asli didapat setelah install di {host()}
      </div>
    </div>
  );
}

/** PNG transparan asli → JPEG ber-watermark (tidak bisa dipakai ulang sebagai template). */
export async function makeThumbnail(original: Buffer): Promise<Buffer> {
  const size = 900;
  const tpl = await sharp(original).resize(780, 780, { fit: 'inside' }).png().toBuffer();
  const wm = await render(<Watermark size={size} />, size, size);
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
          <Brand size={56} />
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
  const W = 1080, H = 1350;
  const row = (k: string, v: string, big = false) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1d2a54', padding: '20px 0' }}>
      <div style={{ display: 'flex', fontSize: 28, color: '#8a97bd' }}>{k}</div>
      <div style={{ display: 'flex', fontSize: big ? 40 : 30, fontWeight: 700, fontFamily: big ? 'Unbounded' : 'Jakarta', color: big ? '#6aa0ff' : '#e8edfb' }}>{v}</div>
    </div>
  );
  const el = (
    <div style={{ display: 'flex', flexDirection: 'column', width: W, height: H, background: '#05070d', color: '#e8edfb', fontFamily: 'Jakarta', padding: 70, position: 'relative', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', position: 'absolute', left: -200, top: 420, width: 1500, height: 500, flexDirection: 'column', transform: 'rotate(-24deg)', opacity: 0.07 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 90, color: '#2d6bff', marginBottom: 30, marginLeft: i % 2 ? 160 : 0 }}>
            ZELVO ZELVO ZELVO ZELVO
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand size={60} />
          <div style={{ display: 'flex', fontSize: 26, color: '#8a97bd' }}>{host()}</div>
        </div>
        <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 40, marginTop: 50, lineHeight: 1.3 }}>Bukti saldo penarikan</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
          {row('Toko', seller.store_name || seller.display_name)}
          {row('Username', '@' + seller.username)}
          {row('Saldo yang ditarik', rupiah(w.amount), true)}
          {row('Bank', w.bank_name)}
          {row('No. rekening', maskAccount(w.account_number, 4))}
          {row('Atas nama', w.account_name)}
          {row('Kode pengajuan', w.code)}
          {row('Dibuat', dateID(w.created_at, true))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #2d6bff', padding: '22px 28px' }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#8a97bd' }}>Kode verifikasi (dicek admin di sistem)</div>
          <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 34, marginTop: 8 }}>{verifyCode}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#8a97bd', marginTop: 22, lineHeight: 1.5 }}>
          Gambar ini dibuat otomatis oleh server ZELVO dari data saldo asli. Angka pada gambar yang diubah tidak akan cocok dengan kode verifikasi di database.
        </div>
      </div>
    </div>
  );
  return render(el, W, H);
}
