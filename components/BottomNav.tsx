'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, House, ShieldCheck, Store, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import clsx from 'clsx';

export function BottomNav({ role, loggedIn }: { role: string | null; loggedIn: boolean }) {
  const path = usePathname();
  const isSeller = role === 'seller' || role === 'admin';
  const items = [
    { href: '/', label: 'Beranda', icon: House, match: (p: string) => p === '/' },
    { href: '/explore', label: 'Jelajah', icon: Compass, match: (p: string) => p.startsWith('/explore') || p.startsWith('/p/') || p.startsWith('/store') },
    {
      href: isSeller ? '/dashboard/seller' : loggedIn ? '/seller/apply' : '/login?next=/seller/apply',
      label: isSeller ? 'Toko' : 'Jual', icon: Store,
      match: (p: string) => p.startsWith('/dashboard/seller') || p.startsWith('/seller'),
    },
    { href: loggedIn ? '/dashboard' : '/login', label: loggedIn ? 'Akun' : 'Masuk', icon: User, match: (p: string) => p === '/dashboard' || p.startsWith('/login') || p.startsWith('/register') },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck, match: (p: string) => p.startsWith('/admin') }] : []),
  ];
  return (
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-50 md:inset-x-auto md:left-1/2 md:bottom-6 md:-translate-x-1/2">
      <div className="flex items-stretch justify-around border-t border-line bg-surface/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:justify-center md:gap-1 md:rounded-full md:border md:p-1.5 md:shadow-[0_12px_40px_-12px_rgb(0_0_0/.55)]">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(path);
          return (
            <Link key={label} href={href} aria-current={active ? 'page' : undefined}
              className={clsx('flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors md:flex-none md:flex-row md:gap-2 md:rounded-full md:px-5 md:py-2.5 md:text-sm',
                active ? 'text-accent md:bg-accent md:text-accent-ink' : 'text-muted hover:text-ink')}>
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
        <div className="flex flex-1 items-center justify-center md:flex-none md:border-l md:border-line md:pl-1.5 md:ml-1">
          <ThemeToggle className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted hover:text-ink md:rounded-full md:p-2.5" />
        </div>
      </div>
    </nav>
  );
}
