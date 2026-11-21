import { randomBytes } from 'node:crypto';
import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { getSnap } from '@/lib/midtrans';
import { FEE_PERCENT, SITE } from '@/lib/constants';

export async function POST(req: Request) {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const me = a.profile;
  const { productId } = await req.json().catch(() => ({}));
  const db = admin();
  const { data: p } = await db.from('products').select('id,slug,title,price,seller_id,status').eq('id', productId).maybeSingle();
  if (!p || p.status !== 'published') return json({ error: 'Produk tidak ditemukan.' }, 404);
  if (p.price <= 0) return json({ error: 'Produk ini gratis.' }, 400);
  if (p.seller_id === me.id) return json({ error: 'Ini produkmu sendiri.' }, 400);

  const { data: paid } = await db.from('orders').select('id').eq('product_id', p.id).eq('buyer_id', me.id).eq('status', 'paid').limit(1).maybeSingle();
  if (paid) return json({ error: 'Kamu sudah membeli template ini.' }, 400);

  // pakai ulang order pending (<20 jam) supaya tidak menumpuk
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const { data: pend } = await db.from('orders').select('id,snap_token').eq('product_id', p.id).eq('buyer_id', me.id)
    .eq('status', 'pending').gte('created_at', since).not('snap_token', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (pend) return json({ token: pend.snap_token, orderId: pend.id });

  const fee = Math.round((p.price * FEE_PERCENT) / 100);
  const orderId = `ZV-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  try {
    const tx = await getSnap().createTransaction({
      transaction_details: { order_id: orderId, gross_amount: p.price },
      item_details: [{ id: p.id.slice(0, 50), price: p.price, quantity: 1, name: p.title.slice(0, 50) }],
      customer_details: { first_name: me.display_name.slice(0, 40), email: me.email || undefined },
      callbacks: { finish: `${SITE.url}/orders/finish?order_id=${orderId}` },
    });
    const { error } = await db.from('orders').insert({
      id: orderId, product_id: p.id, buyer_id: me.id, seller_id: p.seller_id,
      gross_amount: p.price, fee_amount: fee, seller_amount: p.price - fee, snap_token: tx.token,
    });
    if (error) throw error;
    return json({ token: tx.token, orderId });
  } catch (e: any) {
    return json({ error: 'Gagal membuat pembayaran: ' + (e?.ApiResponse?.error_messages?.[0] || e?.message || 'unknown') }, 500);
  }
}
