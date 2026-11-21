import Link from 'next/link';
import clsx from 'clsx';
import { requireRole } from '@/lib/auth';
import { admin } from '@/lib/supabase/admin';
import { dateID, rupiah } from '@/lib/format';
import { thumbUrl } from '@/lib/queries';
import { VerificationCard } from '@/components/VerificationCard';
import { WithdrawPanel } from '@/components/WithdrawPanel';
import { ReferenceModal } from '@/components/ReferenceModal';
import { Stars } from '@/components/Stars';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard toko' };

const TABS = [['ringkasan', 'Ringkasan'], ['produk', 'Produk'], ['transaksi', 'Transaksi'], ['saldo', 'Tarik saldo']] as const;
const wdStatus: Record<string, string> = { requested: 'Menunggu admin', processing: 'Diproses', paid: 'Sudah ditransfer', rejected: 'Ditolak (saldo dikembalikan)' };

export default async function SellerDashboard({ searchParams }: { searchParams: { tab?: string } }) {
  const me = await requireRole(['seller', 'admin'], '/dashboard/seller');
  const tab = TABS.some(([k]) => k === searchParams.tab) ? searchParams.tab! : 'ringkasan';
  const db = admin();
  const { data: fresh } = await db.from('profiles').select('*').eq('id', me.id).single();
  const [{ data: products }, { data: orders }, { data: freeInstalls }, { data: wds }] = await Promise.all([
    db.from('products').select('id,slug,title,price,install_count,rating_avg,rating_count,thumb_path,status,created_at').eq('seller_id', me.id).order('created_at', { ascending: false }),
    db.from('orders').select('id,status,gross_amount,fee_amount,seller_amount,paid_at,created_at,payment_type,product:products(title,slug),buyer:profiles!buyer_id(display_name,username)').eq('seller_id', me.id).order('created_at', { ascending: false }).limit(100),
    db.from('installs').select('created_at,product:products!inner(title,slug,price,seller_id),user:profiles!user_id(display_name,username)').eq('product.seller_id', me.id).eq('product.price', 0).order('created_at', { ascending: false }).limit(100),
    db.from('withdrawals').select('code,amount,status,created_at,bank_name').eq('seller_id', me.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const prods = products || [];
  const paidOrders = (orders || []).filter((o: any) => o.status === 'paid');
  const totalInstalls = prods.reduce((a, p) => a + p.install_count, 0);
  const revenue = paidOrders.reduce((a: number, o: any) => a + o.seller_amount, 0);

  const tx = [
    ...(orders || []).map((o: any) => ({ at: o.paid_at || o.created_at, kind: 'paid', title: o.product?.title, who: o.buyer?.display_name, gross: o.gross_amount, fee: o.fee_amount, net: o.seller_amount, status: o.status, method: o.payment_type })),
    ...(freeInstalls || []).map((i: any) => ({ at: i.created_at, kind: 'free', title: i.product?.title, who: i.user?.display_name, gross: 0, fee: 0, net: 0, status: 'install', method: null })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <div className="space-y-8 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="h-display text-3xl">Dashboard toko</h1><p className="text-sm text-muted">{fresh.store_name || fresh.display_name}, <Link className="text-accent" href={`/store/${fresh.username}`}>lihat halaman toko</Link></p></div>
        <div className="flex gap-2"><ReferenceModal trigger /><Link href="/dashboard/seller/upload" className="btn-primary">Upload template</Link></div>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/dashboard/seller?tab=${k}`} role="tab" aria-selected={tab === k}
            className={clsx('whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold', tab === k ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink')}>{l}</Link>
        ))}
      </div>

      {tab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[['Saldo tersedia', rupiah(fresh.balance)], ['Total pendapatan bersih', rupiah(revenue)], ['Total install', String(totalInstalls)], ['Template', String(prods.length)]].map(([k, v]) => (
              <div key={k} className="bg-surface p-5"><p className="text-xs text-muted">{k}</p><p className="h-display mt-2 text-xl">{v}</p></div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <VerificationCard status={fresh.verified_status} count={fresh.store_rating_count} avg={Number(fresh.store_rating_avg)} trialEnds={fresh.trial_ends_at} />
            <div className="card p-5"><p className="font-bold">Rating toko</p>
              <div className="mt-3 flex items-center gap-3"><span className="h-display text-4xl">{fresh.store_rating_count ? Number(fresh.store_rating_avg).toFixed(1) : '–'}</span><Stars value={Number(fresh.store_rating_avg)} size={18} /></div>
              <p className="mt-1 text-xs text-muted">{fresh.store_rating_count} rating dari semua produkmu</p></div>
          </div>
        </div>
      )}

      {tab === 'produk' && (
        !prods.length ? <div className="card border-dashed p-10 text-center text-sm text-muted">Belum ada template. <Link className="font-semibold text-accent" href="/dashboard/seller/upload">Upload yang pertama</Link></div> : (
          <div className="card divide-y divide-line">
            {prods.map((p) => (
              <Link key={p.id} href={`/p/${p.slug}`} className="flex items-center gap-4 p-3 hover:bg-surface2">
                <div className="checker h-16 w-16 shrink-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={thumbUrl(p.thumb_path)} alt="" className="h-full w-full object-cover" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.title}</p><p className="text-xs text-muted">{p.price > 0 ? rupiah(p.price) : 'Gratis'}, {dateID(p.created_at)}{p.status === 'hidden' ? ', disembunyikan admin' : ''}</p></div>
                <div className="text-right text-sm"><p className="font-bold">{p.install_count} install</p><p className="text-xs text-muted">{p.rating_count ? `★ ${Number(p.rating_avg).toFixed(1)} (${p.rating_count})` : 'Belum ada rating'}</p></div>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'transaksi' && (
        !tx.length ? <div className="card border-dashed p-10 text-center text-sm text-muted">Belum ada transaksi atau install.</div> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3">Waktu</th><th>Template</th><th>Pengguna</th><th>Jenis</th><th className="text-right">Harga</th><th className="text-right">Potongan</th><th className="p-3 text-right">Diterima</th></tr></thead>
              <tbody className="divide-y divide-line">
                {tx.map((t, i) => (
                  <tr key={i}>
                    <td className="p-3 text-xs text-muted">{dateID(t.at, true)}</td><td className="max-w-[200px] truncate font-semibold">{t.title}</td><td>{t.who}</td>
                    <td>{t.kind === 'free' ? 'Install gratis' : t.status === 'paid' ? `Lunas${t.method ? ` (${t.method})` : ''}` : t.status === 'pending' ? 'Menunggu bayar' : 'Gagal/kedaluwarsa'}</td>
                    <td className="text-right">{t.kind === 'free' ? '–' : rupiah(t.gross)}</td><td className="text-right text-muted">{t.kind === 'free' ? '–' : rupiah(t.fee)}</td>
                    <td className="p-3 text-right font-bold">{t.status === 'paid' ? rupiah(t.net) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'saldo' && (
        <div className="space-y-8">
          <WithdrawPanel balance={fresh.balance} />
          <section className="space-y-3">
            <h2 className="h-display text-lg">Riwayat penarikan</h2>
            {!wds?.length ? <p className="text-sm text-muted">Belum ada penarikan.</p> : (
              <div className="card divide-y divide-line">
                {wds.map((w: any) => (
                  <div key={w.code} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                    <div><p className="font-bold">{w.code}</p><p className="text-xs text-muted">{dateID(w.created_at, true)}, {w.bank_name}</p></div>
                    <div className="text-right"><p className="font-bold">{rupiah(w.amount)}</p><p className="text-xs text-muted">{wdStatus[w.status]}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
