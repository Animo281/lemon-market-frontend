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
