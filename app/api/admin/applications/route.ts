import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { AUTO_APPROVE_MINUTES } from '@/lib/constants';

export async function POST(req: Request) {
  const a = await apiProfile(['admin']);
  if ('error' in a) return a.error;
  const { id, action } = await req.json().catch(() => ({}));
  const db = admin();
  const { data: app } = await db.from('seller_applications').select('*').eq('id', id).maybeSingle();
  if (!app) return json({ error: 'Pengajuan tidak ditemukan.' }, 404);
  const now = new Date().toISOString();

  if (action === 'approve') {
    await db.from('seller_applications').update({ status: 'approved', decision_source: 'admin', decided_at: now, hold_auto: false }).eq('id', id);
    await db.from('profiles').update({ role: 'seller', store_name: app.store_name, store_bio: app.bio }).eq('id', app.user_id).eq('role', 'user');
  } else if (action === 'reject') {
    // juga berlaku untuk membatalkan keputusan otomatis (cabut akses penjual)
    await db.from('seller_applications').update({ status: 'rejected', decision_source: 'admin', decided_at: now, hold_auto: false }).eq('id', id);
    await db.from('profiles').update({ role: 'user' }).eq('id', app.user_id).eq('role', 'seller');
    await db.from('products').update({ status: 'hidden' }).eq('seller_id', app.user_id);
  } else if (action === 'hold') {
    await db.from('seller_applications').update({ hold_auto: true }).eq('id', id);
  } else if (action === 'release') {
    await db.from('seller_applications').update({ hold_auto: false, auto_approve_at: new Date(Date.now() + AUTO_APPROVE_MINUTES * 60000).toISOString() }).eq('id', id);
  } else return json({ error: 'Aksi tidak dikenal.' }, 400);
  return json({ ok: true });
}
