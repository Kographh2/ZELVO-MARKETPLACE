import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const a = await apiProfile(['admin']);
  if ('error' in a) return a.error;
  const { id, status } = await req.json().catch(() => ({}));
  if (!['published', 'hidden'].includes(status)) return json({ error: 'Status tidak valid.' }, 400);
  await admin().from('products').update({ status }).eq('id', id);
  return json({ ok: true });
}
