import { admin } from '@/lib/supabase/admin';
import { dateID } from '@/lib/format';
import { AdminAction } from '@/components/AdminButtons';
export const dynamic = 'force-dynamic';

export default async function Page() {
  const db = admin();
  await db.rpc('process_due_applications');
  const { data } = await db.from('seller_applications').select('*, user:profiles!user_id(display_name,username,email,role)').order('created_at', { ascending: false }).limit(60);
  const rows = (data as any[]) || [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Pengajuan baru disetujui otomatis setelah 5 menit. Kamu bisa menahannya, menyetujui sekarang, atau menolak. Menolak pengajuan yang sudah disetujui otomatis akan mencabut akses penjual dan menyembunyikan produknya.</p>
      {!rows.length && <div className="card border-dashed p-8 text-center text-sm text-muted">Belum ada pengajuan.</div>}
      {rows.map((a) => {
        const u = `/api/admin/applications`;
        return (
          <div key={a.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{a.store_name} <span className="font-normal text-muted">oleh @{a.user?.username}</span></p>
                <p className="text-xs text-muted">{a.user?.email}, diajukan {dateID(a.created_at, true)}</p>
                {a.bio && <p className="mt-2 text-sm">{a.bio}</p>}
                {a.portfolio_url && <a className="text-xs text-accent" href={a.portfolio_url} target="_blank" rel="noopener noreferrer">{a.portfolio_url}</a>}
              </div>
              <span className={`chip ${a.status === 'approved' ? 'border-ok text-ok' : a.status === 'rejected' ? 'border-danger text-danger' : ''}`}>
                {a.status === 'pending' ? (a.hold_auto ? 'Ditahan admin' : `Auto-accept ${dateID(a.auto_approve_at, true)}`) : a.status === 'approved' ? `Disetujui (${a.decision_source === 'auto' ? 'otomatis' : 'admin'})` : 'Ditolak'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.status !== 'approved' && <AdminAction url={u} body={{ id: a.id, action: 'approve' }} label="Setujui sekarang" variant="primary" />}
              {a.status === 'pending' && !a.hold_auto && <AdminAction url={u} body={{ id: a.id, action: 'hold' }} label="Tahan auto-accept" />}
              {a.status === 'pending' && a.hold_auto && <AdminAction url={u} body={{ id: a.id, action: 'release' }} label="Lepas tahan (5 menit lagi)" />}
              {a.status !== 'rejected' && <AdminAction url={u} body={{ id: a.id, action: 'reject' }} label={a.status === 'approved' ? 'Cabut akses' : 'Tolak'} variant="danger" confirm="Yakin? Produk penjual ini akan disembunyikan jika aksesnya dicabut." />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
