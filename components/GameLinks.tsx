import { GAME } from '@/lib/constants';
export function GameLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <a href={GAME.android} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">Game di Android</a>
      <a href={GAME.ios} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">Game di iPhone</a>
    </div>
  );
}
