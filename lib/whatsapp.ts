import { WA_PRIMARY, WA_BACKUP } from './constants';
import { rupiah, dateID } from './format';

export function withdrawalMessage(w: any, seller: any, verifyCode: string) {
  return [
    'Halo Admin ZELVO 👋',
    '',
    'Saya ingin mengajukan *penarikan saldo*.',
    '',
    `• Kode pengajuan: ${w.code}`,
    `• Kode verifikasi: ${verifyCode}`,
    `• Toko: ${seller.store_name || seller.display_name}`,
    `• Username: @${seller.username}`,
    `• Nominal: ${rupiah(w.amount)}`,
    `• Bank: ${w.bank_name}`,
    `• No. rekening: ${w.account_number}`,
    `• Atas nama: ${w.account_name}`,
    `• Waktu pengajuan: ${dateID(w.created_at, true)}`,
    '',
    'Gambar bukti saldo otomatis dari ZELVO saya lampirkan di chat ini. Terima kasih 🙏',
  ].join('\n');
}
export const waLink = (intl: string, text: string) => `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
export const waLinks = (text: string) => ({ primary: waLink(WA_PRIMARY.intl, text), backup: waLink(WA_BACKUP.intl, text) });
