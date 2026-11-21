'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('zelvo-theme', next ? 'dark' : 'light'); } catch {}
    setDark(next);
  };
  return (
    <button onClick={toggle} aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'} className={className}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
