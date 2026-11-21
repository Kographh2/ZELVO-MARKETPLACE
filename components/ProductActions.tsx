'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, ShoppingBag } from 'lucide-react';
import { rupiah } from '@/lib/format';

declare global { interface Window { snap?: any } }

export function ProductActions({ product, loggedIn, isOwner, hasAccess }: {
  product: { id: string; slug: string; price: number }; loggedIn: boolean; isOwner: boolean; hasAccess: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const paid = product.price > 0;

  if (!loggedIn)
    return (
      <div className="space-y-2">
        <Link href={`/login?next=${encodeURIComponent('/p/' + product.slug)}`} className="btn-primary w-full">
          {paid ? `Masuk untuk beli ${rupiah(product.price)}` : 'Masuk untuk install gratis'}
        </Link>
        <p className="hint">Login diperlukan agar install tercatat dan kamu bisa memberi rating.</p>
      </div>
    );

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
