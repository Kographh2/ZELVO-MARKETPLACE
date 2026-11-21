'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { ReferenceModal } from './ReferenceModal';
import { MAX_PRICE, MIN_PRICE, TEMPLATE_SIZE, MAX_UPLOAD_MB } from '@/lib/constants';

type Opt = { id: number; name: string };

async function inspect(file: File): Promise<string | null> {
  if (file.type !== 'image/png') return 'File harus berformat PNG.';
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `Ukuran file maksimal ${MAX_UPLOAD_MB} MB.`;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    if (img.naturalWidth !== TEMPLATE_SIZE || img.naturalHeight !== TEMPLATE_SIZE)
      return `Ukuran harus ${TEMPLATE_SIZE}×${TEMPLATE_SIZE} px. File kamu ${img.naturalWidth}×${img.naturalHeight}.`;
    const c = document.createElement('canvas'); c.width = c.height = TEMPLATE_SIZE;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, TEMPLATE_SIZE, TEMPLATE_SIZE).data;
    let transparent = false;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 255) { transparent = true; break; }
    if (!transparent) return 'Background masih solid. Hapus background agar PNG transparan.';
    return null;
  } catch { return 'File gambar tidak bisa dibaca.'; }
  finally { URL.revokeObjectURL(url); }
}

export function UploadForm({ styles, motors }: { styles: Opt[]; motors: Opt[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [fileErr, setFileErr] = useState('');
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(f: File | null) {
    setFile(null); setPreview(''); setFileErr('');
    if (!f) return;
    const e = await inspect(f);
    if (e) return setFileErr(e);
    setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setErr('Pilih file PNG dulu.');
    setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const u = await (await fetch('/api/products/upload-url', { method: 'POST' })).json();
      if (!u.token) throw new Error(u.error || 'Gagal menyiapkan upload.');
      const up = await supabaseBrowser().storage.from('templates').uploadToSignedUrl(u.path, u.token, file, { contentType: 'image/png' });
      if (up.error) throw new Error(up.error.message);
      const r = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: u.path, title: f.get('title'), description: f.get('description'), styleId: f.get('styleId'), motorId: f.get('motorId'), price: paid ? f.get('price') : 0 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push(`/p/${d.slug}`);
    } catch (ex: any) { setErr(ex.message || 'Upload gagal.'); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <label className="checker crop flex aspect-square cursor-pointer items-center justify-center border border-dashed border-line text-center">
          {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="Pratinjau template" className="h-full w-full object-contain" /> : (
            <span className="max-w-[16rem] bg-bg/90 p-4 text-sm text-muted">Klik untuk pilih PNG transparan {TEMPLATE_SIZE}×{TEMPLATE_SIZE} px</span>
          )}
          <input type="file" accept="image/png" hidden onChange={(e) => pick(e.target.files?.[0] || null)} />
        </label>
        {fileErr && <p role="alert" className="text-sm text-danger">{fileErr}</p>}
        {file && <p className="text-xs text-ok">File valid: PNG {TEMPLATE_SIZE}×{TEMPLATE_SIZE}, transparan.</p>}
        <ReferenceModal trigger />
        <p className="hint">Yang tampil di halaman produk hanya thumbnail ber-watermark yang dibuat otomatis. File asli hanya bisa diunduh setelah install.</p>
      </div>
      <div className="space-y-5">
        <div><label className="label" htmlFor="title">Judul</label><input id="title" name="title" required minLength={3} maxLength={80} className="input" placeholder="Contoh: Sunmori Vietnam Biru Hitam" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="styleId">Kategori gaya</label>
            <select id="styleId" name="styleId" required className="input" defaultValue=""><option value="" disabled>Pilih gaya</option>{styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="label" htmlFor="motorId">Kategori motor</label>
            <select id="motorId" name="motorId" required className="input" defaultValue=""><option value="" disabled>Pilih motor</option>{motors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        </div>
        <div><label className="label" htmlFor="description">Deskripsi</label><textarea id="description" name="description" rows={4} maxLength={1500} className="input" placeholder="Warna, cara pakai, bagian motor yang cocok…" /></div>
        <fieldset>
          <legend className="label">Harga</legend>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaid(false)} className={`chip ${!paid ? 'chip-on' : ''}`}>Gratis</button>
            <button type="button" onClick={() => setPaid(true)} className={`chip ${paid ? 'chip-on' : ''}`}>Berbayar</button>
          </div>
          {paid && (
            <div className="mt-3"><input name="price" type="number" required min={MIN_PRICE} max={MAX_PRICE} step={500} className="input" placeholder="Harga dalam rupiah, mis. 5000" />
              <p className="hint">Rp {MIN_PRICE.toLocaleString('id-ID')} sampai Rp {MAX_PRICE.toLocaleString('id-ID')}. Ada potongan platform per penjualan.</p></div>
          )}
        </fieldset>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        <button disabled={busy || !file} className="btn-primary w-full">{busy ? 'Mengunggah…' : 'Terbitkan template'}</button>
      </div>
    </form>
  );
}
