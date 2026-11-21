import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { makeThumbnail } from '@/lib/imaging';
import { slugify } from '@/lib/format';
import { TEMPLATE_SIZE, MIN_PRICE, MAX_PRICE, MAX_UPLOAD_MB } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const a = await apiProfile(['seller', 'admin']);
  if ('error' in a) return a.error;
  const me = a.profile;
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: 'Data tidak valid.' }, 400);

  const { path, title, description, styleId, motorId } = body;
  const price = Math.round(Number(body.price) || 0);
  const db = admin();
  const fail = async (msg: string, code = 422) => {
    if (path && String(path).startsWith(me.id + '/')) await db.storage.from('templates').remove([path]);
    return json({ error: msg }, code);
  };

  if (!path || !String(path).startsWith(me.id + '/')) return json({ error: 'Path file tidak valid.' }, 400);
  if (!title || String(title).trim().length < 3) return fail('Judul minimal 3 karakter.');
  if (!styleId || !motorId) return fail('Pilih kategori gaya dan kategori motor.');
  if (price !== 0 && (price < MIN_PRICE || price > MAX_PRICE)) return fail(`Harga harus 0 (gratis) atau Rp ${MIN_PRICE}–${MAX_PRICE}.`);

  const { data: blob, error: dlErr } = await db.storage.from('templates').download(path);
  if (dlErr || !blob) return json({ error: 'File belum terunggah.' }, 400);
  const buf = Buffer.from(await blob.arrayBuffer());
  if (buf.length > MAX_UPLOAD_MB * 1024 * 1024) return fail(`Ukuran file maksimal ${MAX_UPLOAD_MB} MB.`);

  let meta;
  try { meta = await sharp(buf).metadata(); } catch { return fail('File bukan gambar yang valid.'); }
  if (meta.format !== 'png') return fail('File harus berformat PNG.');
  if (meta.width !== TEMPLATE_SIZE || meta.height !== TEMPLATE_SIZE)
    return fail(`Ukuran harus ${TEMPLATE_SIZE}×${TEMPLATE_SIZE} px (file kamu ${meta.width}×${meta.height}).`);
  if (!meta.hasAlpha) return fail('PNG harus transparan (punya alpha channel).');
  const alpha = await sharp(buf).ensureAlpha().extractChannel(3).stats();
  if (alpha.channels[0].min >= 255) return fail('Background PNG masih solid. Hapus background agar transparan.');

  const id = randomUUID();
  const thumbPath = `${id}.jpg`;
  try {
    const thumb = await makeThumbnail(buf);
    const up = await db.storage.from('thumbnails').upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
  } catch (e: any) {
    return fail('Gagal membuat thumbnail: ' + (e?.message || 'unknown'), 500);
  }

  const slug = `${slugify(String(title))}-${randomBytes(3).toString('hex')}`;
  const { error } = await db.from('products').insert({
    id, slug, seller_id: me.id, title: String(title).trim().slice(0, 80),
    description: String(description || '').slice(0, 1500),
    style_id: Number(styleId), motor_id: Number(motorId), price, file_path: path, thumb_path: thumbPath,
  });
  if (error) {
    await db.storage.from('thumbnails').remove([thumbPath]);
    return fail(error.message, 500);
  }
  return json({ slug });
}
