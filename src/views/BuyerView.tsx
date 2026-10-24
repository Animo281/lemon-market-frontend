import { useEffect, useRef, useState } from 'react'
import { AvailableOffer, Player, PublicSession } from '../shared/types'
import { DEFAULT_BUYER_VALUES } from '../shared/constants'
import { api } from '../api/client'
import { STALL_SLOTS, laneCount } from '../lib/marketScene'
import BuyerHud from '../components/buyer/BuyerHud'
import MarketLane from '../components/buyer/MarketLane'
import ProfitTable from '../components/ProfitTable'
import ValueNote from '../components/buyer/ValueNote'
import MarketHistory from '../components/buyer/MarketHistory'
import MyPurchases from '../components/buyer/MyPurchases'
import RoundEndCard from '../components/RoundEndCard'

interface Props {
  session: PublicSession
  me: Player
  code: string
  playerToken: string
  error: string
  onSessionUpdate: (s: PublicSession) => void
  onError: (msg: string) => void
}

export default function BuyerView({ session, me, code, playerToken, error, onSessionUpdate, onError }: Props) {
  // session.economics is viewer-masked (toPublic.ts) — a buyer always gets
  // buyerValues, the fallback only matters defensively (e.g. before the
  // first successful poll response).
  const buyerValues = session.economics.buyerValues ?? DEFAULT_BUYER_VALUES
  const [justBought, setJustBought] = useState<string | null>(null)
  const [liveMsg, setLiveMsg] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)

  useEffect(() => { setJustBought(null) }, [session.currentRound])

  // Tracks horizontal scroll position to drive the mobile snap-position dots
  // (all lanes share one 1024px-wide world and scroll in lockstep, so one
  // set of 4 dots — one per stall column — covers every lane).
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) { setActiveDot(0); return }
      const progress = el.scrollLeft / maxScroll
      setActiveDot(Math.round(progress * (STALL_SLOTS.length - 1)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const sellers = session.players.filter(p => p.role === 'seller').sort((a, b) => a.slotIndex - b.slotIndex)
  const buyers = session.players.filter(p => p.role === 'buyer').sort((a, b) => a.slotIndex - b.slotIndex)
  // Indexed by slotIndex, not array position — with sparsely-filled seller
  // slots (e.g. only slot 2 of 0-3 joined), sellers[0] used to land in the
  // first stall regardless of which slot they actually picked.
  const sellerBySlot = new Map(sellers.map(s => [s.slotIndex, s]))
  const lanes = laneCount(session.numSellers)

  // The board only reveals once every seller has submitted (phase → 'market');
  // during 'lobby'/'seller-input' some sellers may have already decided while
  // others haven't, but nothing should show early — so the scene gets an
  // empty offer map outside 'market' regardless of what's already been typed.
  const offersBySellerId = session.phase === 'market'
    ? new Map(session.availableOffers.map((o: AvailableOffer) => [o.sellerId, o]))
    : new Map<string, AvailableOffer>()

  const myDecision = session.phase === 'market' ? session.currentBuyerDecisions[me.id] : undefined
  // The backend enforces shopping order server-side (submitBuyerDecision
  // rejects anyone not in session.activeBuyerIds) — reading the server's own
  // active group is what makes the buy button's enabled state actually
  // match what a buy attempt will do. Buyers act in small concurrent groups
  // now, not strictly one at a time, so this can be true for several
  // buyers at once.
  const isMyTurn = session.phase === 'market' && session.activeBuyerIds.includes(me.id)

  // Announce + flash only on the false→true flip, not on every poll while
  // already active — a screen reader shouldn't repeat "du bist dran" every
  // ~1.5s, and the flash is meant to catch the eye once, not strobe.
  const wasMyTurn = useRef(isMyTurn)
  const [turnFlash, setTurnFlash] = useState(false)
  useEffect(() => {
    if (isMyTurn && !wasMyTurn.current) {
      setLiveMsg('Du bist dran!')
      setTurnFlash(true)
      const t = setTimeout(() => setTurnFlash(false), 1200)
      wasMyTurn.current = isMyTurn
      return () => clearTimeout(t)
    }
    wasMyTurn.current = isMyTurn
  }, [isMyTurn])
  const isLastRound = session.currentRound >= session.totalRounds
  const lastResult = session.results[session.results.length - 1]
  const myLastBuyerResult = lastResult?.buyerDecisions.find(b => b.playerId === me.id)

  const [buying, setBuying] = useState(false)

  const handleBuy = async (sellerId: string | null) => {
    if (!playerToken || buying) return
    setBuying(true)
    try {
      const s = await api.buyerDecision(code, playerToken, sellerId)
      onSessionUpdate(s)
      if (sellerId) {
        const seller = sellers.find(x => x.id === sellerId)
        const bd = s.currentBuyerDecisions[me.id]
        const price = bd?.price != null ? bd.price.toFixed(2) : '—'
        // grade/earnings are masked to null/0 by the backend while the market
        // is still open in asymmetric mode (toPublic.ts) — even for the buyer
        // who just bought. Saying "Gewinn: 0,00 €" there would misreport an
        // unknown profit as a real zero, so this only claims a number when
        // the backend actually sent one.
        const stillHidden = s.infoMode === 'asymmetric' && s.phase === 'market'
        setJustBought(sellerId)
        setLiveMsg(stillHidden
          ? `Zitronen von ${seller?.name ?? 'diesem Stand'} für ${price} € gekauft. Qualität wird am Rundenende aufgedeckt.`
          : `Zitronen von ${seller?.name ?? 'diesem Stand'} für ${price} € gekauft. Dein Gewinn: ${(bd?.earnings ?? 0).toFixed(2)} €.`)
        requestAnimationFrame(() => {
          document.querySelector<HTMLButtonElement>(`[data-seller-id="${sellerId}"]`)?.focus()
        })
      } else {
        setJustBought(null)
        setLiveMsg('Kein Kauf in dieser Runde.')
      }
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setBuying(false)
    }
  }

  // A click on a "disabled" stall/pass button used to be a silent no-op —
  // aria-disabled (not disabled) is used deliberately so screen readers can
  // still find the control, but that means clicks do reach onClick. Give a
  // reason instead of nothing happening.
  const handleBlocked = (reason: string) => onError(reason)

  const showScene = session.phase === 'lobby' || session.phase === 'seller-input' || session.phase === 'market'

  return (
    <div className="min-h-screen eve-page p-2 md:p-3">
      {/* Buyer feedback: "Bildschirmfläche effektiver nutzen" — widened from
          max-w-5xl (1024px) so the scene and its tiles grow with the window
          on desktop instead of sitting in a fixed-width column with empty
          margins either side. Still well above the scene's 880px min-width
          (docs/lemon-market-ui/HANDOFF.md). */}
      <div className="max-w-[1600px] mx-auto space-y-2">
        {/* pr-12 reserves room for the fixed ThemeToggle (top-4 right-4, ~36px
            wide) so the session code doesn't run underneath it below ~1120px
            viewport width — see docs/lemon-market-ui overlap audit. */}
        <div className="flex items-center justify-between pl-1 pr-12 font-hand text-sm eve-meta">
          <span>{me.name} · Käufer {me.slotIndex + 1}</span>
          <span className="font-caps tracking-widest">{code}</span>
        </div>

        {error && (
          <div role="alert" className="eve-note px-4 py-2.5 text-sm" style={{ borderColor: '#A8261C', color: '#A8261C' }}>
            {error}
          </div>
        )}
        <p className="sr-only" role="status" aria-live="polite">{liveMsg}</p>

        {showScene && (
          <>
            <BuyerHud
              round={session.currentRound}
              infoMode={session.infoMode}
              phase={session.phase}
              isMyTurn={isMyTurn}
              hasDecided={myDecision !== undefined}
              turnDeadline={session.phase === 'market' ? session.turnDeadline : null}
              turnFlash={turnFlash}
            />
            <ValueNote buyerValues={buyerValues} />
            <MarketHistory results={session.results} sellers={sellers} />

            <div className="scene-scroller" ref={scrollerRef}>
              <div className="scene-world">
                {Array.from({ length: lanes }, (_, l) => (
                  <MarketLane
                    key={l}
                    laneIndex={l}
                    showLaneName={lanes > 1}
                    laneSellers={Array.from({ length: STALL_SLOTS.length }, (_, k) => sellerBySlot.get(l * STALL_SLOTS.length + k))}
                    offersBySellerId={offersBySellerId}
                    myDecision={myDecision}
                    interactive={isMyTurn}
                    justBoughtSellerId={justBought}
                    onBuy={handleBuy}
                    onBlocked={handleBlocked}
                  />
                ))}
              </div>
            </div>
            <div className="scene-snap-dots" aria-hidden="true">
              {STALL_SLOTS.map((_, i) => (
                <span key={i} className={`scene-snap-dot${i === activeDot ? ' active' : ''}`} />
              ))}
            </div>

            {session.phase === 'market' ? (
              <div className="flex flex-col items-center gap-3 pt-1">
                <button
                  type="button"
                  className="scene-pass-btn"
                  aria-disabled={!isMyTurn || undefined}
                  onClick={() => {
                    if (!isMyTurn) { handleBlocked(myDecision ? 'Du hast in dieser Runde schon entschieden.' : 'Du bist gerade nicht an der Reihe.'); return }
                    handleBuy(null)
                  }}
                >
                  Nicht kaufen
                </button>
                <div className="eve-note px-5 py-2 text-sm">
                  {myDecision ? 'Entscheidung abgegeben — warte auf andere Käufer…'
                    : isMyTurn ? 'Du bist dran!'
                    : 'Warte auf deinen Zug…'}
                </div>
              </div>
            ) : (
              <div className="eve-note px-5 py-3 text-center">
                {session.phase === 'lobby' ? 'Warte auf Spielstart' : 'Verkäufer richten ihre Stände her…'}
              </div>
            )}
          </>
        )}

        {session.phase === 'round-end' && lastResult && (
          <RoundEndCard
            round={lastResult.round}
            infoMode={lastResult.infoMode}
            earnings={myLastBuyerResult?.earnings ?? 0}
            isLastRound={isLastRound}
          >
            {myLastBuyerResult?.sellerId ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="opacity-60 text-xs">Gekauft bei</div>
                  <div className="font-caps text-base">{sellers.find(s => s.id === myLastBuyerResult.sellerId)?.name ?? '—'}</div>
                </div>
                <div>
                  <div className="opacity-60 text-xs">Qualität</div>
                  <div className="font-caps text-base">{myLastBuyerResult.grade ? `Q${myLastBuyerResult.grade}` : '—'}</div>
                </div>
                <div>
                  <div className="opacity-60 text-xs">Preis bezahlt</div>
                  <div className="font-caps text-base">{myLastBuyerResult.price?.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="opacity-60 text-xs">Käuferwert</div>
                  <div className="font-caps text-base">
                    {myLastBuyerResult.grade ? `${buyerValues[myLastBuyerResult.grade].toFixed(2)} €` : '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-70">Kein Kauf in dieser Runde</div>
            )}
          </RoundEndCard>
        )}

        {session.phase === 'game-end' && (
          // .panel, not .eve-note — see the matching comment in SellerView.tsx.
          <div className="panel p-6">
            <h2 className="font-display text-3xl font-bold text-lemon-400 mb-4">Alle Ergebnisse</h2>
            <MyPurchases results={session.results} sellers={sellers} buyerId={me.id} />
            <ProfitTable results={session.results} sellers={sellers} buyers={buyers} />
          </div>
        )}
      </div>
    </div>
  )
}
