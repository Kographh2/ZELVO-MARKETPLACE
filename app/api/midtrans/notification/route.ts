import { createHash } from 'node:crypto';
import { json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { getSnap, mapStatus } from '@/lib/midtrans';
import { safeEqual } from '@/lib/sign';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.order_id) return json({ error: 'bad request' }, 400);
  // 1) validasi signature_key dari Midtrans
  const expected = createHash('sha512').update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`).digest('hex');
  if (!body.signature_key || !safeEqual(String(body.signature_key), expected)) return json({ error: 'invalid signature' }, 403);
  // 2) konfirmasi ulang status langsung ke Midtrans (jangan percaya body mentah)
  try {
    const st = await getSnap().transaction.notification(body);
    await admin().rpc('settle_order', {
      p_order: st.order_id, p_status: mapStatus(st.transaction_status, st.fraud_status),
      p_tx: st.transaction_id ?? null, p_type: st.payment_type ?? null,
    });
  } catch (e: any) {
    return json({ error: e?.message || 'failed' }, 500);
  }
  return json({ ok: true });
}
