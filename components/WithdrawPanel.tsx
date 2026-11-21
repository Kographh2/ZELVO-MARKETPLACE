'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { BANKS, MIN_WITHDRAW, WA_BACKUP, WA_PRIMARY } from '@/lib/constants';
import { rupiah } from '@/lib/format';

export function WithdrawPanel({ balance }: { balance: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<any>(null);
  const [sec, setSec] = useState(600);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const can = balance >= MIN_WITHDRAW;

  useEffect(() => { if (!res) return; const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [res]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/seller/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bank: f.get('bank'), accountNumber: f.get('accountNumber'), accountName: f.get('accountName') }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setErr(d.error);
    setRes(d); setSec(600); router.refresh();
  }

  async function shareProof(openUrl: string) {
    if (!res) return;
    setSharing(true); setShareNote('');
    try {
      const blob = await (await fetch(`/api/withdrawals/${res.code}/image`)).blob();
      const file = new File([blob], `bukti-saldo-${res.code}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: res.message || '' });
        setShareNote('Gambar bukti dan pesan siap dibagikan. Pilih WhatsApp lalu kirim ke chat admin.');
        return;
      }
      const a = document.createElement('a');
      a.href = `/api/withdrawals/${res.code}/image`;
      a.download = `bukti-saldo-${res.code}.png`;
      a.click();
      window.open(openUrl, '_blank', 'noopener,noreferrer');
      setShareNote('Browser ini belum bisa membagikan gambar otomatis. Gambar diunduh dan chat admin dibuka; lampirkan gambarnya lalu kirim.');
    } catch (e: any) {
      if (e?.name !== 'AbortError') setShareNote('Gagal membagikan gambar. Unduh gambar lalu lampirkan manual ke chat admin.');
    } finally {
      setSharing(false);
    }
  }

  if (res)
    return (
      <div className="card crop space-y-5 p-6">
        <h2 className="h-display text-xl">Pengajuan {res.code} dibuat</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Tekan tombol bagikan WhatsApp; pesan dan gambar bukti dibagikan otomatis.</li>
          <li>Pilih WhatsApp, lalu pilih chat admin, dan kirim.</li>
          <li>Tunggu balasan admin sekitar 5 sampai 10 menit.</li>
        </ol>
        <div className="checker flex justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/withdrawals/${res.code}/image`} alt="Bukti saldo penarikan" className="max-h-[420px] w-auto" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={sharing} onClick={() => shareProof(res.primary)} className="btn-primary">
            {sharing ? 'Menyiapkan gambar…' : 'Bagikan bukti + pesan ke WhatsApp'}
          </button>
          <a className="btn-ghost" href={`/api/withdrawals/${res.code}/image`} download={`bukti-saldo-${res.code}.png`}><Download size={16} />Unduh gambar bukti</a>
        </div>
        <p className="text-xs text-muted">Admin utama: {WA_PRIMARY.label} ({WA_PRIMARY.display}). Pilih chat ini setelah WhatsApp terbuka. <a className="text-accent" href={res.primary} target="_blank" rel="noopener noreferrer">Buka chat tanpa gambar (teks saja)</a></p>
        {shareNote && <p role="status" className="text-sm text-ok">{shareNote}</p>}
        <div className="border border-line p-4">
          {sec > 0 ? (
            <p className="text-sm text-muted">Belum dibalas? WhatsApp cadangan terbuka dalam {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">Belum ada balasan lebih dari 10 menit. Coba admin cadangan {WA_BACKUP.label} ({WA_BACKUP.display}):</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={sharing} onClick={() => shareProof(res.backup)} className="btn-primary">
                  {sharing ? 'Menyiapkan gambar…' : 'Bagikan bukti + pesan'}
                </button>
                <a className="btn-ghost" href={res.backup} target="_blank" rel="noopener noreferrer">Buka chat (teks saja)</a>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted">Kode verifikasi: <b>{res.verifyCode}</b></p>
      </div>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <h2 className="h-display text-xl">Tarik saldo</h2>
        <p className="mt-1 text-sm text-muted">Saldo tersedia <b className="text-ink">{rupiah(balance)}</b>. Minimal penarikan {rupiah(MIN_WITHDRAW)} (standar transfer antar bank). Seluruh saldo ditarik sekaligus.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="bank">Bank</label><select id="bank" name="bank" required className="input" defaultValue="">{<option value="" disabled>Pilih bank</option>}{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
        <div><label className="label" htmlFor="accountNumber">Nomor rekening</label><input id="accountNumber" name="accountNumber" inputMode="numeric" required className="input" /></div>
      </div>
      <div><label className="label" htmlFor="accountName">Nama pemilik rekening</label><input id="accountName" name="accountName" required className="input" /></div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button disabled={!can || busy} className="btn-primary">{busy ? 'Membuat pengajuan…' : can ? 'Ajukan penarikan' : `Saldo belum mencapai ${rupiah(MIN_WITHDRAW)}`}</button>
    </form>
  );
}
