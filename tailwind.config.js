const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { bg: c('bg'), surface: c('surface'), surface2: c('surface2'), line: c('line'), ink: c('ink'), muted: c('muted'), accent: c('accent'), 'accent-ink': c('accent-ink'), danger: c('danger'), ok: c('ok') },
      fontFamily: {
        display: ['Unbounded', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
