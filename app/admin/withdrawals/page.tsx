import { admin } from '@/lib/supabase/admin';
import { dateID, rupiah } from '@/lib/format';
import { SITE, WA_PRIMARY } from '@/lib/constants';
import { withdrawalVerifyCode } from '@/lib/sign';
import { AdminAction, CopyLink, VerifyCode } from '@/components/AdminButtons';
export const dynamic = 'force-dynamic';

const label: Record<string, string> = { requested: 'Menunggu', processing: 'Diproses', paid: 'Sudah ditransfer', rejected: 'Ditolak' };

export default async function Page() {
  const { data } = await admin().from('withdrawals').select('*, seller:profiles!seller_id(display_name,username,store_name), legal:legal_records(token,is_public)').order('created_at', { ascending: false }).limit(50);
  const rows = (data as any[]) || [];
  const u = '/api/admin/withdrawals';
  return (
    <div className="space-y-6">
      <VerifyCode />
      <div className="card p-5 text-sm text-muted">
        <b className="text-ink">QR legal</b> hanya tampil di halaman ini (admin). Scan dengan HP: terbuka di <b>{SITE.url.replace(/^https?:\/\//, '')}</b> dan menampilkan dokumen asli. Link publiknya baru aktif setelah kamu menekan <b>Publikasikan</b>, misalnya saat ada seller yang meragukan transaksi. Admin WhatsApp: {WA_PRIMARY.display}.
      </div>
      {!rows.length && <div className="card border-dashed p-8 text-center text-sm text-muted">Belum ada pengajuan penarikan.</div>}
      {rows.map((w) => {
        const legal = Array.isArray(w.legal) ? w.legal[0] : w.legal;
        return (
          <div key={w.id} className="card grid gap-5 p-5 md:grid-cols-[1fr_180px]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2"><b>{w.code}</b><span className="chip">{label[w.status]}</span></div>
              <p className="h-display text-xl">{rupiah(w.amount)}</p>
              <p className="text-sm">{w.seller?.store_name || w.seller?.display_name} (@{w.seller?.username})</p>
              <p className="text-sm text-muted">{w.bank_name}, {w.account_number}, a.n. {w.account_name}</p>
              <p className="text-xs text-muted">Diajukan {dateID(w.created_at, true)}. Kode verifikasi: {withdrawalVerifyCode(w)}</p>
              <div className="flex flex-wrap gap-2">
                <a className="btn-ghost btn-sm" href={`/api/withdrawals/${w.code}/image`} target="_blank" rel="noopener noreferrer">Lihat gambar bukti</a>
                {w.status === 'requested' && <AdminAction url={u} body={{ id: w.id, action: 'processing' }} label="Tandai diproses" />}
                {['requested', 'processing'].includes(w.status) && <AdminAction url={u} body={{ id: w.id, action: 'paid' }} label="Sudah ditransfer" variant="primary" confirm="Pastikan transfer sudah dilakukan." />}
                {['requested', 'processing'].includes(w.status) && <AdminAction url={u} body={{ id: w.id, action: 'reject' }} label="Tolak dan kembalikan saldo" variant="danger" confirm="Saldo akan dikembalikan ke penjual." />}
                {legal && !legal.is_public && <AdminAction url={u} body={{ id: w.id, action: 'publish' }} label="Publikasikan link legal" />}
                {legal?.is_public && <><CopyLink text={`${SITE.url}/legal/${legal.token}`} /><AdminAction url={u} body={{ id: w.id, action: 'unpublish' }} label="Tarik dari publik" /></>}
              </div>
            </div>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/legal/${w.id}/qr`} alt={`QR legal ${w.code}`} className="mx-auto w-40 border border-line bg-white" />
              <p className="mt-1.5 text-xs text-muted">QR legal (khusus admin)</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
