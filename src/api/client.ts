import { Grade, Role, PublicSession } from '../shared/types'

const BASE = import.meta.env.VITE_API_URL ?? 'https://lemon-market-backend.onrender.com/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${url}`, options)
  } catch {
    // fetch() rejects with a TypeError on offline/DNS/CORS failures — without
    // this guard, the browser's raw "Failed to fetch" string reaches the UI.
    throw new ApiError(0, 'Keine Verbindung zum Server. Prüfe deine Internetverbindung.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `Serverfehler (${res.status}).`)
  }
  return res.json().catch(() => {
    throw new ApiError(res.status, 'Antwort vom Server war ungültig.')
  })
}

function post<T>(url: string, body?: unknown, token?: string): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-token': token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export interface CreateSessionResponse { code: string; adminToken: string; sessionId: string }
export interface JoinSessionResponse { playerToken: string; playerId: string; session: PublicSession }

export const api = {
  createSession: (numSellers: number, numBuyers: number) =>
    post<CreateSessionResponse>('/session', { numSellers, numBuyers }),

  updateSessionConfig: (code: string, adminToken: string, config: { maxSellerUnits?: number; totalRounds?: number }) =>
    request<PublicSession>(`/session/${code}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-token': adminToken },
      body: JSON.stringify(config),
    }),

  // token is optional: an admin/player passing their own token gets their own
  // grade reflected back even in asymmetric mode (see backend README,
  // "Viewer-aware responses"); an anonymous poll (e.g. the join lobby) still
  // works exactly as before.
  getSession: (code: string, token?: string) =>
    request<PublicSession>(`/session/${code}`, token ? { headers: { 'x-token': token } } : undefined),

  joinSession: (code: string, name: string, role: Role, slotIndex: number) =>
    post<JoinSessionResponse>(`/session/${code}/join`, { name, role, slotIndex }),

  startGame: (code: string, adminToken: string) =>
    post<PublicSession>(`/session/${code}/start`, undefined, adminToken),

  sellerDecision: (code: string, playerToken: string, grade: Grade, price: number, unitsOffered: number) =>
    post<PublicSession>(`/session/${code}/seller-decision`, { grade, price, unitsOffered }, playerToken),

  buyerDecision: (code: string, playerToken: string, sellerId: string | null) =>
    post<PublicSession>(`/session/${code}/buyer-decision`, { sellerId }, playerToken),

  nextRound: (code: string, adminToken: string) =>
    post<PublicSession>(`/session/${code}/next-round`, undefined, adminToken),

  toggleInfoMode: (code: string, adminToken: string) =>
    post<PublicSession>(`/session/${code}/toggle-info-mode`, undefined, adminToken),

  kickPlayer: (code: string, playerId: string, adminToken: string) =>
    request<PublicSession>(`/session/${code}/players/${playerId}`, {
      method: 'DELETE',
      headers: { 'x-token': adminToken },
    }),

  skipBuyer: (code: string, adminToken: string) =>
    post<PublicSession>(`/session/${code}/skip-buyer`, undefined, adminToken),

  forceAdvance: (code: string, adminToken: string) =>
    post<PublicSession>(`/session/${code}/force-advance`, undefined, adminToken),
}
