import { createHmac, timingSafeEqual } from 'node:crypto';

export const sign = (data: string) =>
  createHmac('sha256', process.env.APP_SECRET || 'dev-secret-ganti-di-production').update(data).digest('hex');

/** Kode verifikasi bukti saldo: tidak bisa dipalsukan tanpa APP_SECRET. */
export function withdrawalVerifyCode(w: { code: string; seller_id: string; amount: number; created_at: string }) {
  return `${w.code}-${sign(`${w.code}|${w.seller_id}|${w.amount}|${new Date(w.created_at).toISOString()}`).slice(0, 8).toUpperCase()}`;
}
export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
