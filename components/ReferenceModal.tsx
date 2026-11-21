'use client';
import { useState } from 'react';
import { Download, X } from 'lucide-react';

export function ReferenceModal({ autoOpen = false, trigger = false }: { autoOpen?: boolean; trigger?: boolean }) {
  const [open, setOpen] = useState(autoOpen);
  const close = () => {
    setOpen(false);
    if (autoOpen) fetch('/api/me/reference-seen', { method: 'POST' }).catch(() => {});
  };
  return (
    <>
      {trigger && <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm">Lihat referensi desain</button>}
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Referensi desain resmi" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="card crop flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h2 className="h-display text-lg">Referensi desain dari game</h2>
                <p className="mt-1.5 text-sm text-muted">
                  Ini template resmi dari game. Ikuti pola dan posisi area striping-nya. Hasil akhir wajib PNG transparan ukuran 1024×1024 px.
                </p>
              </div>
              <button onClick={close} aria-label="Tutup" className="p-1 text-muted hover:text-ink"><X size={20} /></button>
            </div>
            <div className="checker overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/reference/official-reference.png" alt="Template striping resmi dari game, 1024×1024 px" className="mx-auto w-full max-w-md" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">
              <a href="/reference/official-reference.png" download="zelvo-referensi-resmi.png" className="btn-ghost"><Download size={16} />Unduh referensi</a>
              <button onClick={close} className="btn-primary">Mengerti, mulai berkarya</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
