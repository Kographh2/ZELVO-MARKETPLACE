import { apiProfile, json } from '@/lib/api';
import { admin } from '@/lib/supabase/admin';
import { MIN_WITHDRAW } from '@/lib/constants';
import { withdrawalVerifyCode } from '@/lib/sign';
import { withdrawalMessage, waLinks } from '@/lib/whatsapp';

export async function POST(req: Request) {
  const a = await apiProfile(['seller', 'admin']);
  if ('error' in a) return a.error;
  const me = a.profile;
  const b = await req.json().catch(() => ({}));
  const bank = String(b.bank || '').trim().slice(0, 40);
  const acc = String(b.accountNumber || '').replace(/\s|-/g, '');
  const name = String(b.accountName || '').trim().slice(0, 60);
  if (!bank || !/^\d{5,20}$/.test(acc) || name.length < 3) return json({ error: 'Lengkapi bank, nomor rekening (angka), dan nama pemilik rekening.' }, 400);

  const db = admin();
  const { data: w, error } = await db.rpc('create_withdrawal', { p_seller: me.id, p_bank: bank, p_acc: acc, p_name: name, p_min: MIN_WITHDRAW });
  if (error) return json({ error: error.message.includes('SALDO_KURANG') ? `Saldo minimal untuk penarikan adalah Rp ${MIN_WITHDRAW.toLocaleString('id-ID')}.` : error.message }, 400);
  const verifyCode = withdrawalVerifyCode(w);
  const message = withdrawalMessage(w, me, verifyCode);
  return json({ code: w.code, verifyCode, amount: w.amount, message, ...waLinks(message) });
}
