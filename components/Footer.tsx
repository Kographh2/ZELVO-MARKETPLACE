import { DEVELOPERS, GAME } from '@/lib/constants';
import { Logo } from './Logo';
import { GameLinks } from './GameLinks';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm text-muted">
            Tempat komunitas berbagi template striping untuk {GAME.name}. Preview selalu ber-watermark, file PNG transparan 1024×1024 hanya lewat tombol install.
          </p>
          <p className="text-xs text-muted">ZELVO dibuat komunitas dan tidak berafiliasi resmi dengan developer game.</p>
        </div>
        <div className="space-y-3 md:text-right">
          <p className="text-sm text-muted">Dikembangkan oleh</p>
          <p className="h-display text-base">{DEVELOPERS}</p>
          <GameLinks className="md:justify-end" />
        </div>
      </div>
    </footer>
  );
}
