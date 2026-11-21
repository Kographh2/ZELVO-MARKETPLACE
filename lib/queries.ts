import { admin } from './supabase/admin';

export const PRODUCT_SELECT =
  'id,slug,title,description,price,install_count,rating_avg,rating_count,thumb_path,status,seller_id,created_at,' +
  'style:style_categories(id,name,slug),motor:motor_categories(id,name,slug),' +
  'seller:profiles!seller_id(id,username,display_name,store_name,verified_status,store_rating_avg,store_rating_count)';

export const thumbUrl = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${p}`;
export const reviewImgUrl = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-images/${p}`;

export interface ListOpts {
  q?: string; style?: string; motor?: string; price?: string; sort?: string; limit?: number;
  sellerId?: string; excludeSeller?: string; excludeId?: string; styleId?: number; motorId?: number;
}

export async function listProducts(o: ListOpts = {}) {
  const db = admin();
  let q = db.from('products').select(PRODUCT_SELECT).eq('status', 'published');
  if (o.style) {
    const { data: s } = await db.from('style_categories').select('id').eq('slug', o.style).maybeSingle();
    q = q.eq('style_id', s?.id ?? -1);
  }
  if (o.motor) {
    const { data: m } = await db.from('motor_categories').select('id').eq('slug', o.motor).maybeSingle();
    q = q.eq('motor_id', m?.id ?? -1);
  }
  if (o.q) q = q.ilike('title', `%${o.q.replace(/[%,()]/g, ' ').trim()}%`);
  if (o.price === 'free') q = q.eq('price', 0);
  if (o.price === 'paid') q = q.gt('price', 0);
  if (o.sellerId) q = q.eq('seller_id', o.sellerId);
  if (o.excludeSeller) q = q.neq('seller_id', o.excludeSeller);
  if (o.excludeId) q = q.neq('id', o.excludeId);
  if (o.styleId) q = q.eq('style_id', o.styleId);
  if (o.motorId) q = q.eq('motor_id', o.motorId);
  if (o.sort === 'popular') q = q.order('install_count', { ascending: false });
  else if (o.sort === 'rating') q = q.order('rating_avg', { ascending: false }).order('rating_count', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  const { data } = await q.limit(o.limit ?? 24);
  return (data as any[]) || [];
}

export async function getCategories() {
  const db = admin();
  const [s, m] = await Promise.all([
    db.from('style_categories').select('id,name,slug').order('sort'),
    db.from('motor_categories').select('id,name,slug').order('sort'),
  ]);
  return { styles: (s.data as any[]) || [], motors: (m.data as any[]) || [] };
}
