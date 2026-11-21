import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { json } from '@/lib/api';
import { getProfile } from '@/lib/auth';
import { admin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getProfile(); // boleh kosong: tamu yang sudah install juga bisa memberi rating
  const guestToken = cookies().get('zelvo_guest')?.value;
  if (!me && !guestToken) return json({ error: 'Install template ini dulu sebelum memberi rating.' }, 403);

  const db = admin();
  const form = await req.formData();
  const rating = Number(form.get('rating'));
  const comment = String(form.get('comment') || '').trim().slice(0, 800);
  const file = form.get('image');
  if (!(rating >= 1 && rating <= 5)) return json({ error: 'Pilih rating 1–5 bintang.' }, 400);

  const { data: p } = await db.from('products').select('id,seller_id').eq('id', params.id).maybeSingle();
  if (!p) return json({ error: 'Produk tidak ditemukan.' }, 404);

  // identitas pemberi rating: akun login ATAU tamu (nama dari catatan install)
  let who: { user_id?: string; guest_token?: string; guest_name?: string };
  if (me) {
    if (p.seller_id === me.id) return json({ error: 'Kamu tidak bisa me-review produkmu sendiri.' }, 403);
    const { data: inst } = await db.from('installs').select('id').eq('product_id', p.id).eq('user_id', me.id).maybeSingle();
    if (!inst) return json({ error: 'Install template ini dulu sebelum memberi rating.' }, 403);
    who = { user_id: me.id };
  } else {
    const { data: inst } = await db.from('installs').select('guest_name').eq('product_id', p.id).eq('guest_token', guestToken).maybeSingle();
    if (!inst) return json({ error: 'Install template ini dulu sebelum memberi rating.' }, 403);
    who = { guest_token: guestToken, guest_name: inst.guest_name };
  }

  let image_path: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/') || file.size > 6 * 1024 * 1024) return json({ error: 'Gambar harus berupa foto maksimal 6 MB.' }, 400);
    try {
      const out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1280, 1280, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      const path = `${me ? me.id : 'guest'}/${randomUUID()}.jpg`; // jangan pernah pakai token tamu di path publik
      const up = await db.storage.from('review-images').upload(path, out, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      image_path = path;
    } catch { return json({ error: 'Gambar tidak bisa diproses.' }, 400); }
  }

  const row: any = { product_id: p.id, rating, comment: comment || null, ...who };
  if (image_path) row.image_path = image_path;

  // ubah rating lama jika ada, kalau belum ada buat baru
  let q = db.from('reviews').select('id').eq('product_id', p.id);
  q = me ? q.eq('user_id', me.id) : q.eq('guest_token', guestToken);
  const { data: existing } = await q.maybeSingle();
  const { error } = existing
    ? await db.from('reviews').update(row).eq('id', existing.id)
    : await db.from('reviews').insert(row);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
