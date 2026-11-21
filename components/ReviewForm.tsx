'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ImagePlus } from 'lucide-react';

export function ReviewForm({ productId, existing }: { productId: string; existing?: { rating: number; comment: string | null } | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hover, setHover] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) { setErr('Pilih jumlah bintang dulu.'); return; }
    setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    f.set('rating', String(rating));
    if (file) f.set('image', file); else f.delete('image');
    const r = await fetch(`/api/products/${productId}/review`, { method: 'POST', body: f });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || 'Gagal mengirim rating.');
    setFile(null); router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="font-bold">{existing ? 'Ubah rating kamu' : 'Beri rating'}</h3>
      <div role="radiogroup" aria-label="Rating bintang" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} role="radio" aria-checked={rating === i} aria-label={`${i} bintang`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>
            <Star size={28} className={i <= (hover || rating) ? 'fill-accent text-accent' : 'text-line'} />
          </button>
        ))}
      </div>
      <textarea name="comment" defaultValue={existing?.comment || ''} maxLength={800} rows={3} placeholder="Ceritakan hasilnya di game (opsional)" className="input" />
      <label className="btn-ghost btn-sm cursor-pointer">
        <ImagePlus size={16} />{file ? file.name.slice(0, 26) : 'Tambah gambar (opsional)'}
        <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button disabled={busy} className="btn-primary">{busy ? 'Mengirim…' : 'Kirim rating'}</button>
    </form>
  );
}
