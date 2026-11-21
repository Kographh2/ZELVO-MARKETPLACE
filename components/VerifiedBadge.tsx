import { BadgeCheck } from 'lucide-react';
export function VerifiedBadge({ status, size = 15 }: { status?: string; size?: number }) {
  if (status !== 'verified') return null;
  return <BadgeCheck size={size} className="text-accent shrink-0" aria-label="Toko terverifikasi" />;
}
