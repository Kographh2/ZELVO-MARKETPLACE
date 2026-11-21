'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type App = { status: string; auto_approve_at: string; hold_auto: boolean } | null;

export function ApplyForm({ initial, defaultName }: { initial: App; defaultName: string }) {
  const router = useRouter();
  const [app, setApp] = useState<App>(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (app?.status !== 'pending') return;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(app.auto_approve_at).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    const poll = setInterval(async () => {
      const d = await (await fetch('/api/seller/apply')).json();
      if (d.role === 'seller' || d.role === 'admin') { router.push('/dashboard/seller'); router.refresh(); }
      else if (d.application) setApp(d.application);
    }, 8000);
    return () => { clearInterval(t); clearInterval(poll); };
  }, [app, router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/seller/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName: f.get('storeName'), bio: f.get('bio'), portfolio: f.get('portfolio'), agree: f.get('agree') === 'on' }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error);
    router.refresh();
    const s = await (await fetch('/api/seller/apply')).json();
    setApp(s.application);
  }

  if (app?.status === 'pending')
    return (
      <div className="card crop space-y-4 p-7">
        <h2 className="h-display text-xl">Pengajuan sedang diproses</h2>
        {app.hold_auto ? (
          <p className="text-sm text-muted">Admin sedang meninjau pengajuanmu secara manual, jadi persetujuan otomatis ditahan. Kamu akan dikabari di halaman ini.</p>
        ) : (
          <>
            <p className="text-sm text-muted">Pengajuan disetujui otomatis dalam:</p>
            <p className="h-display text-4xl text-accent" aria-live="polite">{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</p>
          </>
        )}
      </div>
    );

  return (
    <form onSubmit={submit} className="card crop space-y-5 p-7">
      {app?.status === 'rejected' && <p className="border border-danger/50 p-3 text-sm text-danger">Pengajuan sebelumnya ditolak admin. Kamu bisa mengajukan ulang setelah memperbaiki data.</p>}
      <div><label className="label" htmlFor="storeName">Nama toko</label><input id="storeName" name="storeName" required minLength={3} maxLength={40} defaultValue={defaultName} className="input" /></div>
      <div><label className="label" htmlFor="bio">Tentang tokomu</label><textarea id="bio" name="bio" rows={3} maxLength={300} className="input" placeholder="Gaya desain, motor favorit, dll." /></div>
      <div><label className="label" htmlFor="portfolio">Link portofolio (opsional)</label><input id="portfolio" name="portfolio" type="url" className="input" placeholder="https://instagram.com/…" /></div>
      <label className="flex gap-3 text-sm"><input type="checkbox" name="agree" className="mt-1 accent-[rgb(var(--accent))]" />
        <span>Saya menyetujui ketentuan: karya orisinal atau milik sendiri, PNG transparan 1024×1024 px, tidak memuat SARA atau pelanggaran hak cipta.</span></label>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <button disabled={busy} className="btn-primary">{busy ? 'Mengirim…' : 'Ajukan sekarang'}</button>
    </form>
  );
}
