import { admin } from './supabase/admin';
import { getSnap, mapStatus } from './midtrans';

/** Tanya Midtrans status terbaru lalu sinkronkan ke database (idempotent). */
export async function syncOrder(orderId: string) {
  const db = admin();
  const { data: order } = await db.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return null;
  if (order.status === 'paid') return order;
  try {
    const st = await getSnap().transaction.status(orderId);
    await db.rpc('settle_order', {
      p_order: orderId,
      p_status: mapStatus(st.transaction_status, st.fraud_status),
      p_tx: st.transaction_id ?? null,
      p_type: st.payment_type ?? null,
    });
  } catch { /* transaksi belum dibuat di Midtrans (user belum memilih metode) */ }
  const { data } = await db.from('orders').select('*').eq('id', orderId).maybeSingle();
  return data;
}
