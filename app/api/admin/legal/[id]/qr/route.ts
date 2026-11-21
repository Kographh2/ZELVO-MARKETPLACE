import QRCode from 'qrcode';
import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { SITE } from '@/lib/constants';

export const runtime = 'nodejs';

/** QR legal: HANYA admin. Isinya mengarah ke domain asli ZELVO (bukan domain supabase). */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await apiProfile(['admin']);
  if ('error' in a) return a.error;
  const { data } = await admin().from('legal_records').select('token').eq('withdrawal_id', params.id).maybeSingle();
  if (!data) return json({ error: 'Tidak ditemukan.' }, 404);
  const png = await QRCode.toBuffer(`${SITE.url}/legal/${data.token}`, { type: 'png', width: 520, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0a1a44', light: '#ffffff' } });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' } });
}
