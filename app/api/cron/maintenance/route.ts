import { json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

// Dipanggil harian (vercel.json): auto-accept tersisa + cek trial verifikasi toko yang habis.
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return json({ error: 'unauthorized' }, 401);
  const db = admin();
  const { data: approved } = await db.rpc('process_due_applications');
  const { data: trials } = await db.from('profiles').select('id').eq('verified_status', 'trial').lte('trial_ends_at', new Date().toISOString());
  for (const t of trials || []) await db.rpc('recompute_store', { p_seller: t.id });
  return json({ approved, trialsChecked: trials?.length || 0 });
}
