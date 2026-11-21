import { admin } from '@/lib/supabase/admin';
import { renderShareImage } from '@/lib/imaging';
import { thumbUrl } from '@/lib/queries';
import { SITE } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const format = new URL(req.url).searchParams.get('format') === 'story' ? 'story' : 'feed';
  const { data: p } = await admin().from('products')
    .select('slug,title,price,install_count,rating_avg,rating_count,thumb_path,status,style:style_categories(name),motor:motor_categories(name),seller:profiles!seller_id(display_name,store_name)')
    .eq('slug', params.slug).eq('status', 'published').maybeSingle();
  if (!p) return new Response('Not found', { status: 404 });
  const img = await fetch(thumbUrl(p.thumb_path));
  const thumbDataUrl = 'data:image/jpeg;base64,' + Buffer.from(await img.arrayBuffer()).toString('base64');
  const png = await renderShareImage({
    title: p.title, store: p.seller?.store_name || p.seller?.display_name, motor: p.motor?.name, style: p.style?.name,
    price: p.price, installs: p.install_count, rating: Number(p.rating_avg), ratingCount: p.rating_count,
    thumbDataUrl, url: `${SITE.url}/p/${p.slug}?ref=share`, format,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
}
