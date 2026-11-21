import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

export async function GET() {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const db = admin();
  await db.rpc('process_due_applications'); // auto-accept yang sudah lewat 5 menit
  const { data: app } = await db.from('seller_applications').select('status,auto_approve_at,hold_auto').eq('user_id', a.profile.id).maybeSingle();
  const { data: me } = await db.from('profiles').select('role').eq('id', a.profile.id).single();
  return json({ application: app, role: me?.role });
}

export async function POST(req: Request) {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const me = a.profile;
  if (me.role !== 'user') return json({ error: 'Akunmu sudah punya akses penjual/admin.' }, 400);
  const b = await req.json().catch(() => ({}));
  const store_name = String(b.storeName || '').trim().slice(0, 40);
  if (store_name.length < 3) return json({ error: 'Nama toko minimal 3 karakter.' }, 400);
  if (!b.agree) return json({ error: 'Kamu harus menyetujui ketentuan penyumbang.' }, 400);
  const db = admin();
  const row = {
    user_id: me.id, store_name, bio: String(b.bio || '').slice(0, 300), portfolio_url: String(b.portfolio || '').slice(0, 200),
    status: 'pending', hold_auto: false, decision_source: null, decided_at: null,
    auto_approve_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
  const { data: ex } = await db.from('seller_applications').select('id,status').eq('user_id', me.id).maybeSingle();
  if (ex?.status === 'pending') return json({ error: 'Pengajuanmu sedang diproses.' }, 400);
  const { error } = ex ? await db.from('seller_applications').update(row).eq('id', ex.id) : await db.from('seller_applications').insert(row);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
