import { BadgeCheck, TriangleAlert } from 'lucide-react';
import { VERIFY } from '@/lib/constants';
import { dateID } from '@/lib/format';

export function VerificationCard({ status, count, avg, trialEnds }: { status: string; count: number; avg: number; trialEnds: string | null }) {
  const pct = Math.min(100, Math.round((count / VERIFY.minRatings) * 100));
  const warn = status === 'trial' || status === 'unverified';
  return (
    <div className={`card p-5 ${warn ? 'border-danger/60' : ''}`}>
      <div className="flex items-center gap-2 font-bold">
        {status === 'verified' ? <BadgeCheck className="text-accent" size={20} /> : warn ? <TriangleAlert className="text-danger" size={20} /> : null}
        {status === 'verified' && 'Toko terverifikasi'}
        {status === 'trial' && 'Masa trial verifikasi'}
        {status === 'unverified' && 'Verifikasi belum aktif'}
        {status === 'none' && 'Progres verifikasi toko'}
      </div>
      {status === 'none' && (
        <>
          <p className="mt-2 text-sm text-muted">Kumpulkan {VERIFY.minRatings} rating dengan rata-rata minimal {VERIFY.minAvg.toFixed(1)} untuk mendapat centang terverifikasi.</p>
          <div className="mt-3 h-2 bg-surface2"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1.5 text-xs text-muted">{count} dari {VERIFY.minRatings} rating{count ? `, rata-rata ${avg.toFixed(1)}` : ''}</p>
        </>
      )}
      {status === 'verified' && <p className="mt-2 text-sm text-muted">Rata-rata {avg.toFixed(1)} dari {count} rating. Jaga di atas {VERIFY.minAvg.toFixed(1)} supaya centang tetap aktif.</p>}
      {status === 'trial' && (
        <p className="mt-2 text-sm text-muted">Rata-rata rating turun ke {avg.toFixed(1)} (batas {VERIFY.minAvg.toFixed(1)}). Kamu punya waktu sampai {trialEnds ? dateID(trialEnds) : `${VERIFY.trialDays} hari`} untuk memperbaikinya. Jika rating masih rendah, centang dicabut.</p>
      )}
      {status === 'unverified' && <p className="mt-2 text-sm text-muted">Rata-rata rating {avg.toFixed(1)} dari {count} rating. Tingkatkan kualitas template (hasil rapi, sesuai bentuk motor, preview jelas) agar rating naik dan centang aktif.</p>}
    </div>
  );
}
