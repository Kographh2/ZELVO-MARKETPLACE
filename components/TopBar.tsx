import Link from 'next/link';
import { Logo } from './Logo';
import { initials } from '@/lib/format';

export function TopBar({ name }: { name?: string | null }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <Link href="/" aria-label="ZELVO beranda"><Logo /></Link>
      {name ? (
        <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-xs font-bold" aria-label="Akun saya">{initials(name)}</Link>
      ) : (
        <div className="flex gap-2">
          <Link href="/login" className="btn-ghost btn-sm">Masuk</Link>
          <Link href="/register" className="btn-primary btn-sm">Daftar</Link>
        </div>
      )}
    </header>
  );
}
