/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mkt: {
          950: 'rgb(var(--mkt-950) / <alpha-value>)',
          900: 'rgb(var(--mkt-900) / <alpha-value>)',
          850: 'rgb(var(--mkt-850) / <alpha-value>)',
          800: 'rgb(var(--mkt-800) / <alpha-value>)',
          700: 'rgb(var(--mkt-700) / <alpha-value>)',
          600: 'rgb(var(--mkt-600) / <alpha-value>)',
          500: 'rgb(var(--mkt-500) / <alpha-value>)',
          400: 'rgb(var(--mkt-400) / <alpha-value>)',
          300: 'rgb(var(--mkt-300) / <alpha-value>)',
          200: 'rgb(var(--mkt-200) / <alpha-value>)',
          100: 'rgb(var(--mkt-100) / <alpha-value>)',
        },
        // Primary: Zitronen-Gelb — Verkäufer, Preise, CTAs, Session-Codes
        lemon: {
          200: 'rgb(253 240 160 / <alpha-value>)',
          300: 'rgb(250 234 106 / <alpha-value>)',
          400: 'rgb(245 216 40 / <alpha-value>)',
          500: 'rgb(240 196 25 / <alpha-value>)',
          600: 'rgb(200 156 8 / <alpha-value>)',
        },
        // Positive: Limette — Gewinne, Volle-Info, Bestätigungen
        lime: {
          400: 'rgb(120 216 72 / <alpha-value>)',
          500: 'rgb(92 192 48 / <alpha-value>)',
          600: 'rgb(66 160 32 / <alpha-value>)',
        },
        // Negative: Coral — Asymm.-Info, Verluste, Q1-Qualität, Fehler
        coral: {
          400: 'rgb(240 112 96 / <alpha-value>)',
          500: 'rgb(232 74 42 / <alpha-value>)',
          600: 'rgb(192 48 24 / <alpha-value>)',
        },
        // Käufer: Eis-Blau
        ice: {
          300: 'rgb(136 216 245 / <alpha-value>)',
          400: 'rgb(90 196 236 / <alpha-value>)',
          500: 'rgb(56 168 216 / <alpha-value>)',
          600: 'rgb(26 136 190 / <alpha-value>)',
        },
        // Kupfer — Sekundärakzent, Konfiguration
        copper: {
          400: 'rgb(208 152 72 / <alpha-value>)',
          500: 'rgb(184 120 40 / <alpha-value>)',
          600: 'rgb(148 96 16 / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '2xl': '0.875rem',
      },
      letterSpacing: {
        tight: '-0.022em',
      },
    },
  },
  plugins: [],
}
