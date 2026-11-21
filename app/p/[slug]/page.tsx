import Link from 'next/link';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Download, Star } from 'lucide-react';
import { admin } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/auth';
import { PRODUCT_SELECT, listProducts, reviewImgUrl, thumbUrl } from '@/lib/queries';
import { snapJsUrl } from '@/lib/midtrans';
import { dateID, initials, rupiah } from '@/lib/format';
import { SITE } from '@/lib/constants';
import { ProductGrid } from '@/components/ProductCard';
import { ProductActions } from '@/components/ProductActions';
import { ReviewForm } from '@/components/ReviewForm';
import { ShareButton } from '@/components/ShareModal';
import { Stars } from '@/components/Stars';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: p } = await admin().from('products').select('title,description,thumb_path').eq('slug', params.slug).maybeSingle();
  if (!p) return {};
  return { title: p.title, description: p.description?.slice(0, 150), openGraph: { images: [`/api/share/${params.slug}/image?format=feed`] } };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const db = admin();
  const me = await getProfile();
  const { data: p } = await db.from('products').select(PRODUCT_SELECT).eq('slug', params.slug).maybeSingle();
  if (!p || (p.status !== 'published' && p.seller_id !== me?.id && me?.role !== 'admin')) notFound();

  const isOwner = me?.id === p.seller_id;
  let hasAccess = false, installed = false;
  if (me && !isOwner) {
    const [{ data: inst }, { data: ord }] = await Promise.all([
      db.from('installs').select('id').eq('product_id', p.id).eq('user_id', me.id).maybeSingle(),
      db.from('orders').select('id').eq('product_id', p.id).eq('buyer_id', me.id).eq('status', 'paid').limit(1).maybeSingle(),
    ]);
    installed = !!inst;
    hasAccess = p.price === 0 || !!ord || me.role === 'admin';
  }

  // tamu (belum login) yang sudah install lewat nama: dikenali dari cookie browser
  const guestToken = !me ? cookies().get('zelvo_guest')?.value : undefined;
  let guestInstalled = false, guestMine: any = null;
  if (guestToken) {
    const [{ data: gi }, { data: gr }] = await Promise.all([
      db.from('installs').select('id').eq('product_id', p.id).eq('guest_token', guestToken).maybeSingle(),
      db.from('reviews').select('rating,comment').eq('product_id', p.id).eq('guest_token', guestToken).maybeSingle(),
    ]);
    guestInstalled = !!gi; guestMine = gr;
  }

  const { data: reviewsRaw } = await db.from('reviews')
    .select('id,user_id,guest_name,rating,comment,image_path,created_at,user:profiles!user_id(display_name,username)')
    .eq('product_id', p.id).order('created_at', { ascending: false }).limit(50);
  const reviews = (reviewsRaw as any[]) || [];
  const mine = reviews.find((r) => r.user_id === me?.id) || null;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));

  const [sameStore, otherStores] = await Promise.all([
    listProducts({ sellerId: p.seller_id, excludeId: p.id, limit: 4, sort: 'popular' }),
    listProducts({ excludeSeller: p.seller_id, motorId: p.motor?.id, limit: 4, sort: 'popular' }),
  ]);
  let others = otherStores;
  if (others.length < 4) others = (await listProducts({ excludeSeller: p.seller_id, limit: 4, sort: 'popular' }));

  const s = p.seller;
  return (
    <div className="space-y-14 pt-4">
      {p.price > 0 && <Script src={snapJsUrl()} data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} strategy="afterInteractive" />}

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="checker crop aspect-square overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl(p.thumb_path)} alt={p.title} className="h-full w-full object-cover" />
          </div>
          <p className="hint">Preview ber-watermark. File asli PNG transparan 1024×1024 px kamu dapat setelah install.</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {p.motor && <Link href={`/explore?motor=${p.motor.slug}`} className="chip">{p.motor.name}</Link>}
            {p.style && <Link href={`/explore?style=${p.style.slug}`} className="chip">{p.style.name}</Link>}
            {p.status === 'hidden' && <span className="chip border-danger text-danger">Disembunyikan</span>}
          </div>
          <h1 className="h-display text-2xl sm:text-3xl">{p.title}</h1>
          <p className="h-display text-2xl text-accent">{p.price > 0 ? rupiah(p.price) : 'Gratis'}</p>

          <div className="grid grid-cols-2 gap-px border border-line bg-line">
            <div className="bg-surface p-4"><p className="flex items-center gap-2 text-xl font-bold"><Download size={18} className="text-accent" />{p.install_count}</p><p className="text-xs text-muted">kali di-install</p></div>
            <div className="bg-surface p-4">
              <p className="flex items-center gap-2 text-xl font-bold"><Star size={18} className="fill-accent text-accent" />{p.rating_count ? Number(p.rating_avg).toFixed(1) : '–'}</p>
              <p className="text-xs text-muted">{p.rating_count} rating</p>
            </div>
          </div>

          <ProductActions product={{ id: p.id, slug: p.slug, price: p.price }} loggedIn={!!me} isOwner={isOwner} hasAccess={hasAccess} />
          <ShareButton slug={p.slug} title={p.title} siteUrl={SITE.url} />

          {p.description && <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{p.description}</p>}

          <Link href={`/store/${s.username}`} className="card flex items-center gap-4 p-4 hover:border-accent">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface2 font-bold">{initials(s.store_name || s.display_name)}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-bold"><span className="truncate">{s.store_name || s.display_name}</span><VerifiedBadge status={s.verified_status} /></span>
              <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <Stars value={Number(s.store_rating_avg)} size={12} />
                {s.store_rating_count ? `${Number(s.store_rating_avg).toFixed(1)} dari ${s.store_rating_count} rating toko` : 'Toko belum punya rating'}
              </span>
            </span>
            <span className="text-sm font-semibold text-accent">Kunjungi</span>
          </Link>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="h-display text-xl">Rating pengguna</h2>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5">
            <div className="card p-5">
              <p className="h-display text-4xl">{p.rating_count ? Number(p.rating_avg).toFixed(1) : '–'}</p>
              <Stars value={Number(p.rating_avg)} size={18} />
              <p className="mt-1 text-xs text-muted">{p.rating_count} rating</p>
              <div className="mt-4 space-y-1.5">
                {dist.map(({ s: star, n }) => (
                  <div key={star} className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-3">{star}</span>
                    <div className="h-1.5 flex-1 bg-surface2"><div className="h-full bg-accent" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} /></div>
                    <span className="w-5 text-right">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            {me && !isOwner && (installed || mine) && <ReviewForm productId={p.id} existing={mine} />}
            {me && !isOwner && !installed && !mine && <p className="card p-4 text-sm text-muted">Install template ini dulu untuk bisa memberi rating.</p>}
            {!me && (guestInstalled || guestMine) && <ReviewForm productId={p.id} existing={guestMine} />}
            {!me && !guestInstalled && !guestMine && <p className="card p-4 text-sm text-muted">Install template ini dulu (cukup isi nama) untuk bisa memberi rating.</p>}
          </div>
          <div className="space-y-3">
            {reviews.length === 0 && <div className="card border-dashed p-8 text-center text-sm text-muted">Belum ada rating. Jadilah yang pertama setelah install.</div>}
            {reviews.map((r) => (
              <article key={r.id} className="card space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface2 text-xs font-bold">{initials(r.user?.display_name || r.guest_name)}</span>
                    <div><p className="text-sm font-bold">{r.user?.display_name || r.guest_name || 'Tamu'}{!r.user && <span className="ml-2 text-xs font-normal text-muted">tamu</span>}</p><Stars value={r.rating} size={13} /></div>
                  </div>
                  <time className="text-xs text-muted">{dateID(r.created_at)}</time>
                </div>
                {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                {r.image_path && (
                  <a href={reviewImgUrl(r.image_path)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reviewImgUrl(r.image_path)} alt="Foto dari pembeli" loading="lazy" className="max-h-56 border border-line" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="h-display text-xl">Lainnya dari {s.store_name || s.display_name}</h2>
        <ProductGrid items={sameStore} empty="Toko ini belum punya produk lain." />
      </section>

      <hr className="border-line" />

      <section className="space-y-5">
        <div>
          <h2 className="h-display text-xl">Rekomendasi dari toko lain</h2>
          <p className="mt-1 text-sm text-muted">Template {p.motor?.name ? `untuk ${p.motor.name} ` : ''}dari kreator berbeda.</p>
        </div>
        <ProductGrid items={others} empty="Belum ada rekomendasi dari toko lain." />
      </section>
    </div>
  );
}
