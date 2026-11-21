import { apiProfile, json } from '@/lib/api';
import { syncOrder } from '@/lib/orders';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const o = await syncOrder(params.id);
  if (!o || (o.buyer_id !== a.profile.id && a.profile.role !== 'admin')) return json({ error: 'Order tidak ditemukan.' }, 404);
  return json({ status: o.status });
}
