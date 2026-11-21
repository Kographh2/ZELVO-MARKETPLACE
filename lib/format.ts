export const rupiah = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
export const dateID = (d: string | Date, time = false) =>
  new Date(d).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }) + (time ? ' WIB' : '');
export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 50) || 'template';
export const initials = (name: string) => (name || '?').trim().slice(0, 2).toUpperCase();
export const maskAccount = (n: string, keep = 3) => (n.length <= keep ? n : '•'.repeat(Math.max(n.length - keep, 3)) + n.slice(-keep));
export const safeNext = (n?: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
