import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

export async function POST() {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  await admin().from('profiles').update({ seen_reference: true }).eq('id', a.profile.id);
  return json({ ok: true });
}
