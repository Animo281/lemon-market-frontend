// sessionStorage = per-tab (nicht localStorage!) — so können mehrere Spieler
// im selben Browser in verschiedenen Tabs gleichzeitig spielen.
// sessionStorage überlebt Page-Reload, aber nicht Tab-Close.
const PREFIX = 'lemons'

export const storage = {
  setAdminToken: (code: string, token: string) =>
    sessionStorage.setItem(`${PREFIX}:admin:${code}`, token),

  getAdminToken: (code: string): string | null =>
    sessionStorage.getItem(`${PREFIX}:admin:${code}`),

  setPlayerToken: (code: string, token: string) =>
    sessionStorage.setItem(`${PREFIX}:player:${code}`, token),

  getPlayerToken: (code: string): string | null =>
    sessionStorage.getItem(`${PREFIX}:player:${code}`),

  setPlayerId: (code: string, id: string) =>
    sessionStorage.setItem(`${PREFIX}:pid:${code}`, id),

  getPlayerId: (code: string): string | null =>
    sessionStorage.getItem(`${PREFIX}:pid:${code}`),

  clear: (code: string) => {
    sessionStorage.removeItem(`${PREFIX}:admin:${code}`)
    sessionStorage.removeItem(`${PREFIX}:player:${code}`)
    sessionStorage.removeItem(`${PREFIX}:pid:${code}`)
  },
}

// localStorage-Index: überlebt Browser-Close für Reconnect.
// Pro Code eine Zeile — Tab-Isolation bleibt erhalten weil sessionStorage
// weiterhin Primary ist; Index wird nur beim Wiedereinstieg genutzt.
const INDEX_KEY = `${PREFIX}:sessions:index`

export interface SessionIndexEntry {
  playerId: string
  playerToken: string
  name: string
  role: 'seller' | 'buyer'
  slotIndex: number
  lastJoined: string  // ISO timestamp
}

export const sessionIndex = {
  save: (code: string, entry: SessionIndexEntry) => {
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      const index: Record<string, SessionIndexEntry> = raw ? JSON.parse(raw) : {}
      index[code] = entry
      localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    } catch { /* ignore storage errors */ }
  },

  getAll: (): Record<string, SessionIndexEntry> => {
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  },

  remove: (code: string) => {
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      if (!raw) return
      const index: Record<string, SessionIndexEntry> = JSON.parse(raw)
      delete index[code]
      localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    } catch { /* ignore storage errors */ }
  },
}
