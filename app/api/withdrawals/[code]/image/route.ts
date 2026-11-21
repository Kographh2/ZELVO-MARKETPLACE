import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { renderBalanceProof } from '@/lib/imaging';
import { withdrawalVerifyCode } from '@/lib/sign';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const a = await apiProfile();
  if ('error' in a) return a.error;
  const db = admin();
  const { data: w } = await db.from('withdrawals').select('*').eq('code', params.code).maybeSingle();
  if (!w || (w.seller_id !== a.profile.id && a.profile.role !== 'admin')) return json({ error: 'Tidak ditemukan.' }, 404);
  const { data: seller } = await db.from('profiles').select('display_name,username,store_name').eq('id', w.seller_id).single();
  const png = await renderBalanceProof(w, seller, withdrawalVerifyCode(w));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store', 'Content-Disposition': `inline; filename="bukti-saldo-${w.code}.png"` } });
}
