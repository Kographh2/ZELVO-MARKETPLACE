import Link from 'next/link';
import { ProductGrid } from '@/components/ProductCard';
import { getCategories, listProducts } from '@/lib/queries';
import clsx from 'clsx';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Jelajah template' };

export default async function Explore({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { q = '', style = '', motor = '', price = '', sort = 'new' } = searchParams;
  const [items, cats] = await Promise.all([listProducts({ q, style, motor, price, sort, limit: 48 }), getCategories()]);
  const sel = 'input appearance-none';
  return (
    <div className="space-y-8 pt-4">
      <h1 className="h-display text-3xl">Jelajah template</h1>
      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Cari judul template" className="input lg:col-span-2" aria-label="Cari" />
        <select name="motor" defaultValue={motor} className={sel} aria-label="Motor">
          <option value="">Semua motor</option>
          {cats.motors.map((m: any) => <option key={m.id} value={m.slug}>{m.name}</option>)}
        </select>
        <select name="style" defaultValue={style} className={sel} aria-label="Gaya">
          <option value="">Semua gaya</option>
          {cats.styles.map((s: any) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <select name="price" defaultValue={price} className={sel} aria-label="Harga">
          <option value="">Gratis dan berbayar</option>
          <option value="free">Gratis</option>
          <option value="paid">Berbayar</option>
        </select>
        <select name="sort" defaultValue={sort} className={sel} aria-label="Urutan">
          <option value="new">Terbaru</option>
          <option value="popular">Paling banyak di-install</option>
          <option value="rating">Rating tertinggi</option>
        </select>
        <button className="btn-primary sm:col-span-2 lg:col-span-6 lg:justify-self-end">Terapkan filter</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {cats.styles.slice(0, 8).map((s: any) => (
          <Link key={s.id} href={`/explore?style=${s.slug}`} className={clsx('chip', style === s.slug && 'chip-on')}>{s.name}</Link>
        ))}
      </div>
      <p className="text-sm text-muted">{items.length} template ditemukan</p>
      <ProductGrid items={items} empty="Tidak ada template yang cocok dengan filter ini." />
    </div>
  );
}
