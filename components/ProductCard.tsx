import Link from 'next/link';
import { Download, Star } from 'lucide-react';
import { rupiah } from '@/lib/format';
import { thumbUrl } from '@/lib/queries';
import { VerifiedBadge } from './VerifiedBadge';

export function ProductCard({ p }: { p: any }) {
  return (
    <Link href={`/p/${p.slug}`} className="group card flex flex-col hover:border-accent transition-colors">
      <div className="checker crop aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(p.thumb_path)} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
        <span className={`absolute right-2 top-2 z-[3] px-2 py-0.5 text-xs font-bold ${p.price > 0 ? 'bg-accent text-accent-ink' : 'bg-bg/90 text-ink border border-line'}`}>
          {p.price > 0 ? rupiah(p.price) : 'Gratis'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{p.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted">
          <span className="truncate">{p.seller?.store_name || p.seller?.display_name}</span>
          <VerifiedBadge status={p.seller?.verified_status} size={13} />
        </p>
        <p className="text-xs text-muted">{[p.motor?.name, p.style?.name].filter(Boolean).join(', ')}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Download size={13} />{p.install_count}</span>
          <span className="inline-flex items-center gap-1">
            <Star size={13} className={p.rating_count ? 'fill-accent text-accent' : ''} />
            {p.rating_count ? `${Number(p.rating_avg).toFixed(1)} (${p.rating_count})` : 'Belum ada'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ items, empty }: { items: any[]; empty?: string }) {
  if (!items.length)
    return <div className="card border-dashed p-10 text-center text-sm text-muted">{empty || 'Belum ada template di sini.'}</div>;
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
