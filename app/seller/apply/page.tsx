import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { admin } from '@/lib/supabase/admin';
import { ApplyForm } from '@/components/ApplyForm';
import { AUTO_APPROVE_MINUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Jadi penyumbang' };

export default async function Page() {
  const me = await requireProfile('/seller/apply');
  if (me.role !== 'user') redirect('/dashboard/seller');
  const db = admin();
  await db.rpc('process_due_applications');
  const { data: fresh } = await db.from('profiles').select('role').eq('id', me.id).single();
  if (fresh?.role === 'seller') redirect('/dashboard/seller');
  const { data: app } = await db.from('seller_applications').select('status,auto_approve_at,hold_auto').eq('user_id', me.id).maybeSingle();
  return (
    <div className="mx-auto max-w-xl space-y-6 pt-4">
      <div>
        <h1 className="h-display text-3xl">Jadi penyumbang</h1>
        <p className="mt-2 text-sm text-muted">Isi data tokomu. Pengajuan disetujui otomatis dalam {AUTO_APPROVE_MINUTES} menit, kecuali admin menahannya untuk ditinjau.</p>
      </div>
      <ApplyForm initial={app} defaultName={me.display_name} />
    </div>
  );
}
