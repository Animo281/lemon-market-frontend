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
        // Theme-aware (rgb(var(--x)) like `mkt`): dark-mode values are the
        // original bright accents; light-mode values (index.css) are darkened
        // variants of the same hues, each verified >=4.5:1 on the lightest
        // panel background these colors are ever used as text on (mkt-850
        // light) — see the a11y contrast fix pass.
        lemon: {
          200: 'rgb(var(--lemon-200) / <alpha-value>)',
          300: 'rgb(var(--lemon-300) / <alpha-value>)',
          400: 'rgb(var(--lemon-400) / <alpha-value>)',
          500: 'rgb(var(--lemon-500) / <alpha-value>)',
          600: 'rgb(var(--lemon-600) / <alpha-value>)',
        },
        // Positive: Limette — Gewinne, Volle-Info, Bestätigungen
        lime: {
          400: 'rgb(var(--lime-400) / <alpha-value>)',
          500: 'rgb(var(--lime-500) / <alpha-value>)',
          600: 'rgb(var(--lime-600) / <alpha-value>)',
        },
        // Negative: Coral — Asymm.-Info, Verluste, Q1-Qualität, Fehler
        coral: {
          400: 'rgb(var(--coral-400) / <alpha-value>)',
          500: 'rgb(var(--coral-500) / <alpha-value>)',
          600: 'rgb(var(--coral-600) / <alpha-value>)',
        },
        // Käufer: Eis-Blau
        ice: {
          300: 'rgb(var(--ice-300) / <alpha-value>)',
          400: 'rgb(var(--ice-400) / <alpha-value>)',
          500: 'rgb(var(--ice-500) / <alpha-value>)',
          600: 'rgb(var(--ice-600) / <alpha-value>)',
        },
        // Kupfer — Sekundärakzent, Konfiguration
        copper: {
          400: 'rgb(var(--copper-400) / <alpha-value>)',
          500: 'rgb(var(--copper-500) / <alpha-value>)',
          600: 'rgb(var(--copper-600) / <alpha-value>)',
        },
        // Dekorativ (Landing-Hero, Session-Codes) — vorher gar nicht
        // definiert (unstyled `text-gold-500`/`bg-gold-500`).
        gold: {
          500: 'rgb(var(--gold-500) / <alpha-value>)',
        },
        // Abendmarkt (Käuferansicht): illustrierte Szene, eigene Palette
        eve: {
          sky: '#4D7AA1',
          ink: '#2B1B12',
          paper: '#F1E4CE',
          lemonade: '#DCCC62',
          chalk: '#2E3631',
          chalkink: '#F3EEE2',
          stamp: '#A8261C',
        },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Menlo', 'monospace'],
        hand:    ['"Patrick Hand"', '"Comic Neue"', 'system-ui', 'sans-serif'],
        caps:    ['"Patrick Hand SC"', '"Patrick Hand"', 'system-ui', 'sans-serif'],
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
