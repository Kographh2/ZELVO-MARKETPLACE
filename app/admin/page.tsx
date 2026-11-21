import Link from 'next/link';
import { admin } from '@/lib/supabase/admin';
import { rupiah } from '@/lib/format';
export const dynamic = 'force-dynamic';

export default async function Page() {
  const db = admin();
  await db.rpc('process_due_applications');
  const c = (t: string, f?: (q: any) => any) => { let q = db.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return q.then((r: any) => r.count || 0); };
  const [users, sellers, prods, pendApps, pendWd, orders] = await Promise.all([
    c('profiles'), c('profiles', (q) => q.eq('role', 'seller')), c('products'),
    c('seller_applications', (q) => q.eq('status', 'pending')), c('withdrawals', (q) => q.in('status', ['requested', 'processing'])),
    db.from('orders').select('gross_amount,fee_amount').eq('status', 'paid'),
  ]);
  const gross = (orders.data || []).reduce((a: number, o: any) => a + o.gross_amount, 0);
  const fee = (orders.data || []).reduce((a: number, o: any) => a + o.fee_amount, 0);
  const cards = [['Pengguna', users, null], ['Penjual', sellers, null], ['Template', prods, null], ['Pengajuan menunggu', pendApps, '/admin/applications'], ['Penarikan perlu diproses', pendWd, '/admin/withdrawals'], ['Omzet / pendapatan platform', `${rupiah(gross)} / ${rupiah(fee)}`, null]] as const;
  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([k, v, href]) => {
        const body = <div className="h-full bg-surface p-5"><p className="text-xs text-muted">{k}</p><p className="h-display mt-2 text-xl">{v}</p></div>;
        return href ? <Link key={k} href={href}>{body}</Link> : <div key={k}>{body}</div>;
      })}
    </div>
  );
}
