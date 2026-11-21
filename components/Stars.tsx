import { Star } from 'lucide-react';
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`Rating ${value.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-accent text-accent' : 'text-line'} />
      ))}
    </span>
  );
}
