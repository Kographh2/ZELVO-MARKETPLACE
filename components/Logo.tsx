/** Mark: huruf Z dari dua bilah striping + diagonal biru. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M17 12H55L50 23H12Z M12 41H50L47 52H9Z" fill="rgb(var(--ink))" />
      <path d="M50 23H34L14 41H30Z" fill="#2d6bff" />
    </svg>
  );
}
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="h-display text-lg tracking-tight">ZELVO</span>
    </span>
  );
}
