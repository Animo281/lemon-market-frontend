import { Grade, Role, PublicSession } from '../shared/types'

const BASE = 'https://lemon-market-backend.onrender.com/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
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

function get<T>(url: string): Promise<T> {
  return request<T>(url)
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

  getSession: (code: string) =>
    get<PublicSession>(`/session/${code}`),

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
