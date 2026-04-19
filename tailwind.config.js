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
        gold: {
          300: '#fad080',
          400: '#f5c060',
          500: '#f0a840',
          600: '#d08820',
        },
        ice: {
          300: '#90deff',
          400: '#6dd4ff',
          500: '#48c4ff',
          600: '#28a0e0',
        },
        lime: {
          400: '#50d888',
          500: '#30c879',
          600: '#20a858',
        },
        coral: {
          400: '#f07070',
          500: '#f05050',
          600: '#d03030',
        },
        violet: {
          400: '#b098f8',
          500: '#9d7ef5',
          600: '#7a58d8',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
