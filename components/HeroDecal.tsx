/** Ilustrasi lembar template: tiga bilah striping di atas kanvas transparan, lengkap dengan tanda potong. */
export function HeroDecal() {
  return (
    <div className="checker crop relative aspect-square w-full max-w-md border border-line">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M30 120 L330 70 L370 96 L120 150 Z" fill="rgb(var(--ink))" />
        <path d="M60 168 L300 120 L330 140 L100 190 Z" fill="rgb(var(--accent))" />
        <path d="M70 215 L360 170 L372 188 L96 236 Z" fill="rgb(var(--ink))" opacity=".85" />
        <path d="M90 262 L250 238 L262 252 L110 282 Z" fill="rgb(var(--accent))" />
        <path d="M50 330 L350 292 L344 306 L40 346 Z" fill="rgb(var(--ink))" opacity=".6" />
      </svg>
      <div className="absolute bottom-3 left-3 bg-bg/90 px-2.5 py-1 text-xs font-semibold text-muted">1024 × 1024 px, PNG transparan</div>
    </div>
  );
}
