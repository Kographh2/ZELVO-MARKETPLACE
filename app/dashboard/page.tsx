import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { admin } from '@/lib/supabase/admin';
import { dateID, rupiah } from '@/lib/format';
import { thumbUrl } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Akun saya' };

const roleLabel: Record<string, string> = { user: 'Pengguna', seller: 'Penyumbang', admin: 'Admin' };
const statusLabel: Record<string, string> = { paid: 'Lunas', pending: 'Menunggu', failed: 'Gagal', expired: 'Kedaluwarsa' };

export default async function Dashboard() {
  const me = await requireProfile('/dashboard');
  const db = admin();
  await db.rpc('process_due_applications');
  const [{ data: installs }, { data: orders }, { data: app }] = await Promise.all([
    db.from('installs').select('created_at,product:products(slug,title,thumb_path,price)').eq('user_id', me.id).order('last_at', { ascending: false }).limit(48),
    db.from('orders').select('id,status,gross_amount,created_at,product:products(slug,title)').eq('buyer_id', me.id).order('created_at', { ascending: false }).limit(20),
    db.from('seller_applications').select('status').eq('user_id', me.id).maybeSingle(),
  ]);
  return (
    <div className="space-y-10 pt-4">
      <div className="card crop flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="h-display text-2xl">{me.display_name}</h1>
          <p className="mt-1 text-sm text-muted">@{me.username}, {me.email} <span className="chip ml-2">{roleLabel[me.role]}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {me.role === 'user' && <Link href="/seller/apply" className="btn-primary">{app?.status === 'pending' ? 'Lihat status pengajuan' : 'Jadi penyumbang'}</Link>}
          {me.role !== 'user' && <Link href="/dashboard/seller" className="btn-primary">Dashboard toko</Link>}
          {me.role === 'admin' && <Link href="/admin" className="btn-ghost">Panel admin</Link>}
          <form action="/auth/signout" method="post"><button className="btn-ghost">Keluar</button></form>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="h-display text-xl">Template yang sudah kamu install</h2>
        {!installs?.length ? <div className="card border-dashed p-8 text-center text-sm text-muted">Belum ada. <Link className="font-semibold text-accent" href="/explore">Jelajahi template</Link></div> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {installs.map((i: any) => (
              <Link key={i.product.slug} href={`/p/${i.product.slug}`} className="card hover:border-accent">
                <div className="checker aspect-square">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={thumbUrl(i.product.thumb_path)} alt="" className="h-full w-full object-cover" loading="lazy" /></div>
                <p className="line-clamp-2 p-2.5 text-xs font-semibold">{i.product.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="h-display text-xl">Riwayat pembelian</h2>
        {!orders?.length ? <p className="text-sm text-muted">Belum ada pembelian.</p> : (
          <div className="card divide-y divide-line">
            {orders.map((o: any) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div><Link href={`/p/${o.product?.slug}`} className="font-bold hover:text-accent">{o.product?.title}</Link><p className="text-xs text-muted">{o.id}, {dateID(o.created_at, true)}</p></div>
                <div className="text-right"><p className="font-bold">{rupiah(o.gross_amount)}</p>
                  {o.status === 'pending' ? <Link className="text-xs font-semibold text-accent" href={`/orders/finish?order_id=${o.id}`}>Menunggu, cek status</Link> : <p className="text-xs text-muted">{statusLabel[o.status]}</p>}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
