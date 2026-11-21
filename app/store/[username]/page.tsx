import { notFound } from 'next/navigation';
import { admin } from '@/lib/supabase/admin';
import { listProducts } from '@/lib/queries';
import { ProductGrid } from '@/components/ProductCard';
import { Stars } from '@/components/Stars';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { dateID, initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Store({ params }: { params: { username: string } }) {
  const { data: s } = await admin().from('profiles')
    .select('id,username,display_name,store_name,store_bio,role,verified_status,store_rating_avg,store_rating_count,created_at')
    .eq('username', params.username.toLowerCase()).maybeSingle();
  if (!s || !['seller', 'admin'].includes(s.role)) notFound();
  const items = await listProducts({ sellerId: s.id, limit: 60 });
  const installs = items.reduce((a, p) => a + p.install_count, 0);
  return (
    <div className="space-y-8 pt-4">
      <div className="card crop flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 text-xl font-bold">{initials(s.store_name || s.display_name)}</span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="h-display flex items-center gap-2 text-2xl"><span className="truncate">{s.store_name || s.display_name}</span><VerifiedBadge status={s.verified_status} size={22} /></h1>
          <p className="text-sm text-muted">@{s.username}, bergabung {dateID(s.created_at)}</p>
          {s.store_bio && <p className="text-sm">{s.store_bio}</p>}
          <p className="flex items-center gap-2 text-sm text-muted">
            <Stars value={Number(s.store_rating_avg)} />
            {s.store_rating_count ? `${Number(s.store_rating_avg).toFixed(1)} dari ${s.store_rating_count} rating` : 'Belum ada rating'}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-6 text-center">
          <div><dt className="text-xs text-muted">Template</dt><dd className="h-display text-xl">{items.length}</dd></div>
          <div><dt className="text-xs text-muted">Install</dt><dd className="h-display text-xl">{installs}</dd></div>
        </dl>
      </div>
      <ProductGrid items={items} empty="Toko ini belum punya template." />
    </div>
  );
}
