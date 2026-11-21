import { NextResponse } from 'next/server';
import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const me = a.profile;
  const db = admin();
  const { data: p } = await db.from('products').select('id,slug,price,seller_id,file_path,status').eq('id', params.id).maybeSingle();
  if (!p || (p.status !== 'published' && p.seller_id !== me.id && me.role !== 'admin')) return json({ error: 'Produk tidak ditemukan.' }, 404);

  let orderId: string | null = null;
  if (p.price > 0 && p.seller_id !== me.id && me.role !== 'admin') {
    const { data: o } = await db.from('orders').select('id').eq('product_id', p.id).eq('buyer_id', me.id).eq('status', 'paid').limit(1).maybeSingle();
    if (!o) return json({ error: 'Produk ini berbayar. Selesaikan pembayaran dulu.' }, 402);
    orderId = o.id;
  }
  if (p.seller_id !== me.id) await db.rpc('register_install', { p_product: p.id, p_user: me.id, p_order: orderId });

  const { data: signed, error } = await db.storage.from('templates').createSignedUrl(p.file_path, 60, { download: `zelvo-${p.slug}.png` });
  if (error || !signed) return json({ error: 'Gagal membuat link download.' }, 500);
  return NextResponse.redirect(signed.signedUrl);
}
