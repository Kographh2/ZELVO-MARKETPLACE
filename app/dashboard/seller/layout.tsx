import { requireRole } from '@/lib/auth';
import { ReferenceModal } from '@/components/ReferenceModal';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole(['seller', 'admin'], '/dashboard/seller');
  return (
    <>
      {/* pop-up referensi desain resmi: muncul sekali untuk penyumbang baru */}
      <ReferenceModal autoOpen={!me.seen_reference} />
      {children}
    </>
  );
}
