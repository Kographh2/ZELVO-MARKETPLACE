import Link from 'next/link';
import { admin } from '@/lib/supabase/admin';
import { rupiah } from '@/lib/format';
import { AdminAction } from '@/components/AdminButtons';
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data } = await admin().from('products').select('id,slug,title,price,status,install_count,seller:profiles!seller_id(username)').order('created_at', { ascending: false }).limit(100);
  return (
    <div className="card divide-y divide-line">
      {((data as any[]) || []).map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <div><Link href={`/p/${p.slug}`} className="font-bold hover:text-accent">{p.title}</Link><p className="text-xs text-muted">@{p.seller?.username}, {p.price ? rupiah(p.price) : 'Gratis'}, {p.install_count} install</p></div>
          <AdminAction url="/api/admin/products" body={{ id: p.id, status: p.status === 'published' ? 'hidden' : 'published' }} label={p.status === 'published' ? 'Sembunyikan' : 'Tampilkan lagi'} variant={p.status === 'published' ? 'danger' : 'primary'} />
        </div>
      ))}
    </div>
  );
}
