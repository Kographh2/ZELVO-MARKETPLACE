import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { syncOrder } from '@/lib/orders';
import { admin } from '@/lib/supabase/admin';
import { rupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Finish({ searchParams }: { searchParams: { order_id?: string } }) {
  const me = await requireProfile('/dashboard');
  const id = searchParams.order_id || '';
  const order = id ? await syncOrder(id) : null;
  if (!order || order.buyer_id !== me.id) return <p className="pt-10 text-muted">Order tidak ditemukan.</p>;
  const { data: p } = await admin().from('products').select('slug,title').eq('id', order.product_id).single();
  const map: Record<string, [string, string]> = {
    paid: ['Pembayaran berhasil', 'Template sudah bisa kamu install dari halaman produk.'],
    pending: ['Menunggu pembayaran', 'Selesaikan pembayaran sesuai instruksi Midtrans. Halaman ini akan terbarui setelah dibayar.'],
    failed: ['Pembayaran gagal', 'Coba lagi dari halaman produk.'],
    expired: ['Pembayaran kedaluwarsa', 'Buat pembayaran baru dari halaman produk.'],
  };
  const [title, desc] = map[order.status] || map.pending;
  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="card crop space-y-3 p-7">
        <h1 className="h-display text-2xl">{title}</h1>
        <p className="text-sm text-muted">{desc}</p>
        <p className="text-sm"><b>{p?.title}</b> · {rupiah(order.gross_amount)}</p>
        <p className="text-xs text-muted">Order {order.id}</p>
        <Link href={`/p/${p?.slug}`} className="btn-primary">{order.status === 'paid' ? 'Buka template' : 'Kembali ke produk'}</Link>
      </div>
    </div>
  );
}
