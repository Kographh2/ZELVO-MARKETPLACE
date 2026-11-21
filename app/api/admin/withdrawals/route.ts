import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { withdrawalVerifyCode, safeEqual } from '@/lib/sign';

export async function POST(req: Request) {
  const a = await apiProfile(['admin']);
  if ('error' in a) return a.error;
  const b = await req.json().catch(() => ({}));
  const db = admin();

  if (b.action === 'verify') {
    const input = String(b.code || '').trim().toUpperCase();
    const code = input.split('-').slice(0, 3).join('-');
    const { data: w } = await db.from('withdrawals').select('*').eq('code', code).maybeSingle();
    if (!w) return json({ valid: false, message: 'Kode pengajuan tidak ada di database.' });
    const ok = safeEqual(input, withdrawalVerifyCode(w));
    return json({ valid: ok, message: ok ? `VALID: ${w.code}, nominal asli Rp ${Number(w.amount).toLocaleString('id-ID')}, status ${w.status}.` : 'Kode verifikasi TIDAK cocok. Gambar kemungkinan diedit.' });
  }

  const { id, action } = b;
  const { data: w } = await db.from('withdrawals').select('*').eq('id', id).maybeSingle();
  if (!w) return json({ error: 'Tidak ditemukan.' }, 404);
  if (action === 'processing') await db.from('withdrawals').update({ status: 'processing' }).eq('id', id);
  else if (action === 'paid') await db.from('withdrawals').update({ status: 'paid', processed_at: new Date().toISOString() }).eq('id', id);
  else if (action === 'reject') { const { error } = await db.rpc('refund_withdrawal', { p_id: id }); if (error) return json({ error: 'Tidak bisa ditolak pada status ini.' }, 400); }
  else if (action === 'publish') await db.from('legal_records').update({ is_public: true, published_at: new Date().toISOString() }).eq('withdrawal_id', id);
  else if (action === 'unpublish') await db.from('legal_records').update({ is_public: false, published_at: null }).eq('withdrawal_id', id);
  else return json({ error: 'Aksi tidak dikenal.' }, 400);
  return json({ ok: true });
}
