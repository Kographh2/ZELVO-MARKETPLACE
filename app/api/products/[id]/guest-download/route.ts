import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';

/** Install tanpa login: tamu mengisi nama, install tetap tercatat. Hanya untuk produk GRATIS. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { name } = await req.json().catch(() => ({}));
  const clean = String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 30);
  if (clean.length < 2) return json({ error: 'Isi nama minimal 2 karakter.' }, 400);

  const db = admin();
  const { data: p } = await db.from('products').select('id,slug,price,file_path,status').eq('id', params.id).maybeSingle();
  if (!p || p.status !== 'published') return json({ error: 'Produk tidak ditemukan.' }, 404);
  if (p.price > 0) return json({ error: 'Template berbayar harus login dulu.' }, 402);

  // token browser (cookie httpOnly) → 1 browser = 1 install per produk
  const jar = cookies();
  let token = jar.get('zelvo_guest')?.value;
  if (!token) {
    token = randomUUID();
    jar.set('zelvo_guest', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  }

  const { error: rpcErr } = await db.rpc('register_guest_install', { p_product: p.id, p_name: clean, p_token: token });
  if (rpcErr) return json({ error: 'Gagal mencatat install: ' + rpcErr.message }, 500);

  const { data: signed, error } = await db.storage.from('templates').createSignedUrl(p.file_path, 60, { download: `zelvo-${p.slug}.png` });
  if (error || !signed) return json({ error: 'Gagal membuat link download.' }, 500);
  return json({ url: signed.signedUrl });
}
