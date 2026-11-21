import Link from 'next/link';
import { requireRole } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin'], '/admin');
  const links = [['/admin', 'Ringkasan'], ['/admin/applications', 'Pengajuan penjual'], ['/admin/withdrawals', 'Penarikan dan legal'], ['/admin/products', 'Produk']];
  return (
    <div className="space-y-6 pt-4">
      <nav aria-label="Menu admin" className="flex gap-1 overflow-x-auto border-b border-line">
        {links.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink">{l}</Link>)}
      </nav>
      {children}
    </div>
  );
}
