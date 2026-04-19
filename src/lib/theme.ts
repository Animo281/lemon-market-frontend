export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  const stored = localStorage.getItem('mkt-theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(t: Theme) {
  localStorage.setItem('mkt-theme', t)
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export function initTheme() {
  setTheme(getTheme())
}
