import { notFound } from 'next/navigation';
import { admin } from '@/lib/supabase/admin';
import { getProfile } from '@/lib/auth';
import { SITE, DEVELOPERS } from '@/lib/constants';
import { dateID, maskAccount, rupiah } from '@/lib/format';
import { withdrawalVerifyCode } from '@/lib/sign';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dokumen legal', robots: { index: false, follow: false } };

const label: Record<string, string> = { requested: 'Pengajuan diterima, menunggu admin', processing: 'Sedang diproses', paid: 'Sudah ditransfer', rejected: 'Ditolak, saldo dikembalikan ke penjual' };

// pola watermark diagonal berulang (SVG data-URI)
const wm = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='360' height='220'><text x='20' y='140' transform='rotate(-24 180 110)' font-family='sans-serif' font-weight='700' font-size='26' fill='%232d6bff' fill-opacity='0.16'>ZELVO • DOKUMEN LEGAL</text></svg>`)}")`;

export default async function Legal({ params }: { params: { token: string } }) {
  const db = admin();
  const { data: rec } = await db.from('legal_records').select('*, w:withdrawals(*, seller:profiles!seller_id(display_name,username,store_name))').eq('token', params.token).maybeSingle();
  if (!rec) notFound();
  const me = await getProfile();
  const isAdmin = me?.role === 'admin';
  // belum dipublikasikan admin → hanya admin yang bisa buka (hasil scan QR)
  if (!rec.is_public && !isAdmin) notFound();
  const w = rec.w;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40" style={{ backgroundImage: wm, backgroundSize: '360px 220px' }} />
      <article className="card crop relative mx-auto mt-6 max-w-2xl space-y-6 p-7 sm:p-10">
        <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
          <Logo />
          <span className="text-xs text-muted">{SITE.url.replace(/^https?:\/\//, '')}</span>
        </header>
        <div>
          <h1 className="h-display text-2xl">Dokumen legal penarikan saldo</h1>
          {!rec.is_public && <p className="mt-2 border border-danger/50 p-2 text-xs text-danger">Pratinjau admin. Dokumen ini belum dipublikasikan dan tidak bisa dibuka publik.</p>}
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Dokumen ini diterbitkan otomatis oleh sistem ZELVO sebagai bukti bahwa pengajuan penarikan saldo dengan kode <b className="text-ink">{w.code}</b> atas nama toko <b className="text-ink">{w.seller?.store_name || w.seller?.display_name}</b> tercatat di database resmi ZELVO. Keaslian dokumen dapat dipastikan karena halaman ini hanya dapat dibuka dari domain resmi ZELVO melalui tautan yang diterbitkan admin.
        </p>
        <dl className="divide-y divide-line border-y border-line text-sm">
          {[['Kode pengajuan', w.code], ['Toko', `${w.seller?.store_name || w.seller?.display_name} (@${w.seller?.username})`], ['Nominal', rupiah(w.amount)], ['Bank tujuan', `${w.bank_name}, ${maskAccount(w.account_number, 3)}`], ['Diajukan', dateID(w.created_at, true)], ['Status', label[w.status]], ['Diproses', w.processed_at ? dateID(w.processed_at, true) : '–'], ['Kode verifikasi', withdrawalVerifyCode(w)]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
          ))}
        </dl>
        <p className="text-xs text-muted">Data rekening disamarkan demi privasi. Dokumen ini tidak dapat dipalsukan: nominal, kode, dan status diambil langsung dari database saat halaman dibuka. Penyalahgunaan atau pengeditan bukti saldo merupakan pelanggaran ketentuan ZELVO. Dikelola oleh {DEVELOPERS}.</p>
      </article>
    </div>
  );
}
