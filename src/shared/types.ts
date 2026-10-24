export type Grade = 1 | 2 | 3
export type GamePhase = 'lobby' | 'seller-input' | 'market' | 'round-end' | 'game-end'
export type InfoMode = 'full' | 'asymmetric'
export type Role = 'seller' | 'buyer'

export interface Player {
  id: string
  name: string
  role: Role
  slotIndex: number
}

export interface SellerDecision {
  playerId: string
  grade: Grade
  price: number
  unitsOffered: number
  unitsSold: number
  earnings: number
}

export interface BuyerDecision {
  playerId: string
  sellerId: string | null
  grade: Grade | null
  price: number | null
  earnings: number
}

export interface RoundMetrics {
  totalSellerProfit: number
  totalBuyerProfit: number
  avgTransactionPrice: number | null
  transactions: number
  theoreticalMaxSurplus: number
  efficiency: number
  equilibrium: { qty: number; price: number } | null
  supplyCurve: number[]
  demandCurve: number[]
}

export interface RoundResult {
  round: number
  infoMode: InfoMode
  sellerDecisions: SellerDecision[]
  buyerDecisions: BuyerDecision[]
  totalSurplus: number
  metrics: RoundMetrics
}

export interface AvailableOffer {
  sellerId: string
  sellerName: string
  unitsOffered: number
  unitsSold: number
  unitsRemaining: number
  price: number | null
  grade: Grade | null
}

// Host-configurable per session (set at create, editable in the lobby).
// unitCostStep is a deliberate deviation from Holt & Sherman (1999), where
// it's a fixed +$1 rule: here the host can set it per session instead.
export interface EconomicsConfig {
  buyerValues: Record<Grade, number>
  sellerFirstCosts: Record<Grade, number>
  unitCostStep: number
}

// Viewer-masked, mirroring the paper's own instructions to keep each side's
// private-information table private: a buyer only ever gets buyerValues, a
// seller only sellerFirstCosts (+ unitCostStep, needed to know what their
// next unit costs), admin gets both, anonymous gets neither.
export interface PublicEconomics {
  buyerValues?: Record<Grade, number>
  sellerFirstCosts?: Record<Grade, number>
  unitCostStep?: number
}

export interface PublicSession {
  id: string
  code: string
  numSellers: number
  numBuyers: number
  maxSellerUnits: number
  totalRounds: number
  phase: GamePhase
  currentRound: number
  infoMode: InfoMode
  players: Player[]
  buyerQueue: string[]
  // epoch ms deadline for the current buyer group's turn; null outside market.
  turnDeadline: number | null
  turnDurationSeconds: number
  currentSellerDecisions: Record<string, Partial<SellerDecision>>
  currentBuyerDecisions: Record<string, BuyerDecision>
  results: RoundResult[]
  // Buyer ids who may currently submit a decision — up to BUYER_GROUP_SIZE at
  // once, market phase only. Replaces the old single currentPlayerId.
  activeBuyerIds: string[]
  availableOffers: AvailableOffer[]
  economics: PublicEconomics
  limits: {
    maxSellerUnits: number
    maxRounds: number
    maxSellers: number
    maxBuyers: number
    minTurnDurationSeconds: number
    maxTurnDurationSeconds: number
  }
  currentRoundMetrics: RoundMetrics | null
}
