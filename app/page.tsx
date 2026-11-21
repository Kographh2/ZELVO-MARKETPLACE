import Link from 'next/link';
import { GameLinks } from '@/components/GameLinks';
import { HeroDecal } from '@/components/HeroDecal';
import { ProductGrid } from '@/components/ProductCard';
import { getCategories, listProducts } from '@/lib/queries';
import { GAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [latest, popular, cats] = await Promise.all([listProducts({ limit: 8 }), listProducts({ limit: 4, sort: 'popular' }), getCategories()]);
  return (
    <div className="space-y-20 pt-6 md:pt-12">
      <section className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <h1 className="h-display text-[2rem] sm:text-5xl md:text-[3.4rem]">Striping motor game kamu, tinggal install.</h1>
          <p className="max-w-lg text-base text-muted">
            Template striping untuk {GAME.name} dari para kreator komunitas. Pilih sesuai motor dan gaya, install, lalu tempel di game. Ada yang gratis, ada yang berbayar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore" className="btn-primary">Jelajahi template</Link>
            <Link href="/seller/apply" className="btn-ghost">Jadi penyumbang</Link>
          </div>
          <GameLinks />
        </div>
        <div className="flex justify-center md:justify-end"><HeroDecal /></div>
      </section>

      <section className="space-y-5">
        <h2 className="h-display text-xl">Cari berdasarkan motor</h2>
        <div className="flex flex-wrap gap-2">
          {cats.motors.map((m: any) => <Link key={m.id} href={`/explore?motor=${m.slug}`} className="chip">{m.name}</Link>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.styles.map((s: any) => <Link key={s.id} href={`/explore?style=${s.slug}`} className="chip">{s.name}</Link>)}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="h-display text-xl">Template terbaru</h2>
          <Link href="/explore" className="text-sm font-semibold text-accent">Lihat semua</Link>
        </div>
        <ProductGrid items={latest} empty="Belum ada template. Jadilah penyumbang pertama!" />
      </section>

      {popular.length > 0 && (
        <section className="space-y-5">
          <h2 className="h-display text-xl">Paling banyak di-install</h2>
          <ProductGrid items={popular} />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="h-display text-xl">Cara pakainya</h2>
        <ol className="grid gap-px border border-line bg-line md:grid-cols-3">
          {[
            ['Pilih template', 'Filter berdasarkan motor dan gaya. Preview ber-watermark supaya karya kreator tetap terlindungi.'],
            ['Install atau beli', 'Template gratis bisa langsung di-install, cukup isi nama tanpa daftar. Template berbayar dibayar lewat Midtrans (QRIS, VA, e-wallet, kartu).'],
            ['Tempel di game', 'Kamu dapat PNG transparan 1024×1024 px, sesuai ketentuan game. Beri rating setelah dipakai.'],
          ].map(([t, d], i) => (
            <li key={t} className="bg-surface p-6">
              <p className="h-display text-2xl text-accent">{i + 1}</p>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card crop flex flex-col items-start gap-5 p-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="h-display text-xl">Punya desain striping?</h2>
          <p className="mt-2 text-sm text-muted">Daftar sebagai penyumbang, unggah karyamu, lalu bagikan gratis atau jual. Saldo penjualan bisa ditarik mulai Rp 25.000. Toko dengan 20 rating bagus mendapat centang terverifikasi.</p>
        </div>
        <Link href="/seller/apply" className="btn-primary shrink-0">Ajukan jadi penyumbang</Link>
      </section>
    </div>
  );
}
