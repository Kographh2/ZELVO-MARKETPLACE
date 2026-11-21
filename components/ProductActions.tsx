'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, ShoppingBag, X } from 'lucide-react';
import { rupiah } from '@/lib/format';

declare global { interface Window { snap?: any } }

export function ProductActions({ product, loggedIn, isOwner, hasAccess }: {
  product: { id: string; slug: string; price: number }; loggedIn: boolean; isOwner: boolean; hasAccess: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [askName, setAskName] = useState(false);
  const [name, setName] = useState('');
  const paid = product.price > 0;

  useEffect(() => { try { setName(localStorage.getItem('zelvo-guest-name') || ''); } catch {} }, []);

  /* ── Tamu (belum login), template GRATIS: cukup isi nama ── */
  async function guestInstall(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { setMsg('Isi nama minimal 2 karakter.'); return; }
    setBusy(true); setMsg('');
    const r = await fetch(`/api/products/${product.id}/guest-download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(d.error || 'Gagal memulai install.'); return; }
    try { localStorage.setItem('zelvo-guest-name', name.trim()); } catch {}
    setAskName(false);
    window.location.href = d.url;
    setTimeout(() => router.refresh(), 2500); // supaya form rating muncul setelah install tercatat
  }

  if (!loggedIn && paid)
    return (
      <div className="space-y-2">
        <Link href={`/login?next=${encodeURIComponent('/p/' + product.slug)}`} className="btn-primary w-full">Masuk untuk beli {rupiah(product.price)}</Link>
        <p className="hint">Template berbayar perlu akun agar pembelianmu tersimpan dan bisa diunduh ulang.</p>
      </div>
    );

  if (!loggedIn)
    return (
      <div className="space-y-2">
        <button onClick={() => setAskName(true)} className="btn-primary w-full"><Download size={18} />Install gratis</button>
        <p className="hint">Tanpa daftar atau login, cukup isi nama. Install kamu tetap tercatat.</p>
        {msg && !askName && <p role="alert" className="text-sm text-danger">{msg}</p>}
        {askName && (
          <div role="dialog" aria-modal="true" aria-label="Isi nama untuk install" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
            <form onSubmit={guestInstall} className="card crop w-full max-w-sm space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="h-display text-lg">Siapa namamu?</h2>
                <button type="button" onClick={() => setAskName(false)} aria-label="Tutup" className="text-muted hover:text-ink"><X size={20} /></button>
              </div>
              <div>
                <label htmlFor="guest-name" className="label">Nama</label>
                <input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required minLength={2} maxLength={30} className="input" placeholder="Nama panggilan juga boleh" autoComplete="nickname" />
                <p className="hint">Nama dipakai untuk mencatat install dan menampilkan rating kamu. Tidak perlu email atau password.</p>
              </div>
              {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
              <button disabled={busy} className="btn-primary w-full">{busy ? 'Menyiapkan file…' : 'Install sekarang'}</button>
              <p className="text-center text-xs text-muted">Sudah punya akun? <Link className="font-semibold text-accent" href={`/login?next=${encodeURIComponent('/p/' + product.slug)}`}>Masuk</Link></p>
            </form>
          </div>
        )}
      </div>
    );

  /* ── Sudah login ── */
  const download = () => { window.location.href = `/api/products/${product.id}/download`; setTimeout(() => router.refresh(), 2500); };

  async function buy() {
    setBusy(true); setMsg('');
    const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || 'Gagal memulai pembayaran.'); setBusy(false); return; }
    if (!window.snap) { setMsg('Pembayaran belum siap. Muat ulang halaman lalu coba lagi.'); setBusy(false); return; }
    const done = async () => { await fetch(`/api/orders/${d.orderId}/sync`); router.refresh(); setBusy(false); };
    window.snap.pay(d.token, {
      onSuccess: done,
      onPending: () => { setMsg('Menunggu pembayaran kamu selesai.'); setBusy(false); },
      onError: () => { setMsg('Pembayaran gagal. Coba lagi.'); setBusy(false); },
      onClose: done,
    });
  }

  if (!paid || hasAccess || isOwner)
    return (
      <div className="space-y-2">
        <button onClick={download} className="btn-primary w-full"><Download size={18} />{isOwner ? 'Unduh file asli' : 'Install (unduh PNG transparan)'}</button>
        {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
      </div>
    );

  return (
    <div className="space-y-2">
      <button onClick={buy} disabled={busy} className="btn-primary w-full"><ShoppingBag size={18} />{busy ? 'Membuka pembayaran…' : `Beli ${rupiah(product.price)}`}</button>
      <p className="hint">Dibayar lewat Midtrans. Setelah lunas, tombol install langsung terbuka.</p>
      {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
    </div>
  );
}
