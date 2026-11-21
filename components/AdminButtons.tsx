'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminAction({ url, body, label, variant = 'ghost', confirm: msg }: { url: string; body: any; label: string; variant?: 'ghost' | 'primary' | 'danger'; confirm?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function run() {
    if (msg && !window.confirm(msg)) return;
    setBusy(true); setErr('');
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error || 'Gagal');
    router.refresh();
  }
  return (
    <span className="inline-flex flex-col">
      <button onClick={run} disabled={busy} className={`btn-sm ${variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-ghost'}`}>{busy ? '…' : label}</button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </span>
  );
}

export function VerifyCode() {
  const [code, setCode] = useState('');
  const [res, setRes] = useState<any>(null);
  async function check(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/admin/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', code }) });
    setRes(await r.json());
  }
  return (
    <form onSubmit={check} className="card space-y-3 p-5">
      <h2 className="font-bold">Cek kode verifikasi dari gambar bukti saldo</h2>
      <div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ZV-WD-XXXXXXXX-XXXXXXXX" className="input" /><button className="btn-primary">Cek</button></div>
      {res && <p role="status" className={`text-sm ${res.valid ? 'text-ok' : 'text-danger'}`}>{res.message}</p>}
    </form>
  );
}

export function CopyLink({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? 'Tersalin' : 'Salin link publik'}</button>;
}
