'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const reg = mode === 'register';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim();
    const password = String(f.get('password'));
    const sb = supabaseBrowser();
    if (reg) {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { display_name: String(f.get('name')).trim(), username: String(f.get('username')).trim() }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) setErr(error.message);
      else if (!data.session) setInfo('Akun dibuat. Cek email kamu untuk konfirmasi, lalu masuk.');
      else { router.push(next); router.refresh(); }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message);
      else { router.push(next); router.refresh(); }
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="card crop p-7">
        <h1 className="h-display text-2xl">{reg ? 'Buat akun ZELVO' : 'Masuk ke ZELVO'}</h1>
        <p className="mt-2 text-sm text-muted">{reg ? 'Satu akun untuk install template, memberi rating, dan mengajukan jadi penyumbang.' : 'Masuk untuk install template dan mengelola toko.'}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {reg && (
            <>
              <div><label className="label" htmlFor="name">Nama</label><input id="name" name="name" required minLength={2} maxLength={40} className="input" autoComplete="name" /></div>
              <div>
                <label className="label" htmlFor="username">Username</label>
                <input id="username" name="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" className="input" autoComplete="username" />
                <p className="hint">Huruf, angka, dan garis bawah. Dipakai untuk alamat tokomu.</p>
              </div>
            </>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={8} className="input" autoComplete={reg ? 'new-password' : 'current-password'} /></div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          {info && <p role="status" className="text-sm text-ok">{info}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Memproses…' : reg ? 'Daftar' : 'Masuk'}</button>
        </form>
        <p className="mt-5 text-sm text-muted">
          {reg ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <Link className="font-semibold text-accent" href={`${reg ? '/login' : '/register'}?next=${encodeURIComponent(next)}`}>{reg ? 'Masuk' : 'Daftar'}</Link>
        </p>
      </div>
    </div>
  );
}
