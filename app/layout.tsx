import type { Metadata, Viewport } from 'next';
import '@fontsource/unbounded/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/700.css';
import './globals.css';
import { getProfile } from '@/lib/auth';
import { SITE } from '@/lib/constants';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'ZELVO – Template striping Drag Bike 201m Sunmori', template: '%s – ZELVO' },
  description: SITE.tagline,
};
export const viewport: Viewport = { themeColor: '#05070d', viewportFit: 'cover' };

const themeScript = `try{var t=localStorage.getItem('zelvo-theme');if(t!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <html lang="id" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <TopBar name={profile?.display_name} />
        <main className="mx-auto max-w-6xl px-4 pb-32 md:pb-36">{children}</main>
        <Footer />
        <div className="h-24 md:h-28" aria-hidden />
        <BottomNav role={profile?.role ?? null} loggedIn={!!profile} />
      </body>
    </html>
  );
}
