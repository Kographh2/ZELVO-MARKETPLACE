import midtransClient from 'midtrans-client';

let snap: any;
export function getSnap() {
  if (!snap) {
    snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    });
  }
  return snap;
}
export const snapJsUrl = () =>
  process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

export function mapStatus(tx: string, fraud?: string): 'paid' | 'pending' | 'failed' | 'expired' {
  if (tx === 'settlement') return 'paid';
  if (tx === 'capture') return fraud === 'challenge' ? 'pending' : 'paid';
  if (tx === 'pending') return 'pending';
  if (tx === 'expire') return 'expired';
  return 'failed'; // deny, cancel, failure, dll
}
