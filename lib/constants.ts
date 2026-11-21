export const SITE = {
  name: 'ZELVO',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  tagline: 'Marketplace template striping Drag Bike 201m Sunmori',
};
export const DEVELOPERS = 'Fizzxdevv × Kographh';
export const GAME = {
  name: 'Drag Bike 201m Sunmori',
  android: 'https://play.google.com/store/apps/details?id=com.MariBerkembang.DragBike201mSunmori',
  ios: 'https://apps.apple.com/us/app/drag-bike-201m-sunmori/id6834298648',
};
export const TEMPLATE_SIZE = 1024;
export const MAX_UPLOAD_MB = 12;
export const MIN_PRICE = 1000;
export const MAX_PRICE = 500000;
export const MIN_WITHDRAW = 25000;
export const FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);
export const VERIFY = { minRatings: 20, minAvg: 4.0, trialDays: 10 };
export const AUTO_APPROVE_MINUTES = 5;
export const WA_PRIMARY = { label: 'Fizzxdevv', display: '0877-8958-3465', intl: '6287789583465' };
export const WA_BACKUP = { label: 'FizzxDevv2', display: '0889-8111-4939', intl: '6288981114939' };
export const BANKS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Permata', 'Jago', 'SeaBank', 'Bank lainnya'];
