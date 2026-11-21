'use client';
import { useState } from 'react';
import { Share2, X, Copy, Download } from 'lucide-react';

export function ShareButton({ slug, title, siteUrl }: { slug: string; title: string; siteUrl: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'feed' | 'story'>('feed');
  const [note, setNote] = useState('');
  const url = `${siteUrl}/p/${slug}?ref=share`;
  const text = `Template striping "${title}" untuk Drag Bike 201m Sunmori di ZELVO`;
  const img = `/api/share/${slug}/image?format=${format}`;
  const enc = encodeURIComponent;

  async function getFile() {
    const blob = await (await fetch(img)).blob();
    return new File([blob], `zelvo-${slug}-${format}.png`, { type: 'image/png' });
  }
  async function instagram() {
    try {
      const file = await getFile();
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}` }); return; }
    } catch { /* dibatalkan */ }
    const a = document.createElement('a'); a.href = img; a.download = `zelvo-${slug}.png`; a.click();
    await navigator.clipboard?.writeText(url).catch(() => {});
    setNote('Gambar diunduh dan link disalin. Instagram tidak punya tombol share web, jadi unggah gambarnya lewat aplikasi Instagram lalu tempel link di bio atau stiker link.');
  }
  const copy = async () => { await navigator.clipboard.writeText(url); setNote('Link disalin.'); };
  const openUrl = (u: string) => window.open(u, '_blank', 'noopener,noreferrer');

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost w-full"><Share2 size={17} />Bagikan</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Bagikan produk" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="card crop flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-4">
              <h2 className="h-display text-lg">Bagikan template</h2>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="text-muted hover:text-ink"><X size={20} /></button>
            </div>
            <div className="grid flex-1 gap-5 overflow-auto p-4 md:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['feed', 'story'] as const).map((f) => (
                    <button key={f} onClick={() => setFormat(f)} className={`chip ${format === f ? 'chip-on' : ''}`}>{f === 'feed' ? 'Feed 4:5' : 'Story 9:16'}</button>
                  ))}
                </div>
                <div className="checker flex justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={format} src={img} alt="Pratinjau gambar share" className="max-h-[52vh] w-auto" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted">Gambar sudah berisi QR dan link ke produk. Pilih tujuan:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={instagram}>Instagram</button>
                  <button className="btn-ghost" onClick={() => openUrl(`https://wa.me/?text=${enc(text + ' ' + url)}`)}>WhatsApp</button>
                  <button className="btn-ghost" onClick={() => openUrl(`https://www.threads.net/intent/post?text=${enc(text + ' ' + url)}`)}>Threads</button>
                  <button className="btn-ghost" onClick={() => openUrl(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`)}>X (Twitter)</button>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost btn-sm flex-1" onClick={copy}><Copy size={15} />Salin link</button>
                  <a className="btn-ghost btn-sm flex-1" href={img} download={`zelvo-${slug}-${format}.png`}><Download size={15} />Unduh gambar</a>
                </div>
                <p className="break-all border border-line bg-bg p-2.5 text-xs text-muted">{url}</p>
                {note && <p role="status" className="text-sm text-ok">{note}</p>}
                <p className="hint">Untuk WhatsApp, Threads, dan X, unduh gambar lalu lampirkan manual (platform tersebut hanya menerima teks dan link dari web).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
