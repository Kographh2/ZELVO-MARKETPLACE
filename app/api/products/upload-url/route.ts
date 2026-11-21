import { randomUUID } from 'node:crypto';
import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

export async function POST() {
  const a = await apiProfile(['seller', 'admin']);
  if ('error' in a) return a.error;
  const path = `${a.profile.id}/${randomUUID()}.png`;
  const { data, error } = await admin().storage.from('templates').createSignedUploadUrl(path);
  if (error) return json({ error: error.message }, 500);
  return json({ path, token: data.token });
}
