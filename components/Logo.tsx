export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M6 12h46l-9 11H22z" fill="rgb(var(--accent))" />
      <path d="M58 52H12l9-11h21z" fill="rgb(var(--accent))" />
      <path d="M25 27h24L27 37z" fill="rgb(var(--ink))" opacity=".85" />
    </svg>
  );
}
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="h-display text-lg tracking-tight">ZELVO</span>
    </span>
  );
}
