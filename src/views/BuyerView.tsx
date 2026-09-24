import { useEffect, useRef, useState } from 'react'
import { AvailableOffer, Player, PublicSession } from '../shared/types'
import { DEFAULT_BUYER_VALUES } from '../shared/constants'
import { api } from '../api/client'
import { MARKET_SCENE_IMAGE, STALL_SLOTS, laneCount } from '../lib/marketScene'
import BuyerHud from '../components/buyer/BuyerHud'
import MarketLane from '../components/buyer/MarketLane'
import ProfitTable from '../components/ProfitTable'
import ValueNote from '../components/buyer/ValueNote'
import MarketHistory from '../components/buyer/MarketHistory'

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
  // The backend now enforces shopping order server-side (submitBuyerDecision
  // rejects anyone but session.currentPlayerId, see backend README "Buyer
  // shopping order") — this used to just check "have I not decided yet",
  // which let every undecided buyer see "Du bist dran" at once. Reading the
  // server's own turn pointer is what makes the buy button's enabled state
  // actually match what a buy attempt will do.
  const isMyTurn = session.phase === 'market' && session.currentPlayerId === me.id
  const isLastRound = session.currentRound >= session.totalRounds
  const lastResult = session.results[session.results.length - 1]
  const myLastBuyerResult = lastResult?.buyerDecisions.find(b => b.playerId === me.id)

  // Stands in for the mockup's "Budget" pill, which has no backend counterpart:
  // running total of this buyer's earnings across finished rounds.
  const balance = session.results.reduce((sum, r) => {
    const bd = r.buyerDecisions.find(b => b.playerId === me.id)
    return sum + (bd?.earnings ?? 0)
  }, 0)

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
    <div className="min-h-screen eve-page p-3 md:p-5">
      {/* max-w-5xl (1024px), not the app's usual max-w-2xl/3xl: the scene
          itself has min-width:880px (docs/lemon-market-ui/HANDOFF.md) and must fit uncropped
          well before that breakpoint, or it'd scroll on ordinary desktops. */}
      <div className="max-w-5xl mx-auto space-y-4">
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
              totalRounds={session.totalRounds}
              infoMode={session.infoMode}
              balance={balance}
              phase={session.phase}
              isMyTurn={isMyTurn}
              hasDecided={myDecision !== undefined}
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
          <div className="relative rounded-2xl overflow-hidden" style={{ border: '3px solid #2B1B12', aspectRatio: '1024 / 572' }}>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, filter: 'brightness(.32) saturate(.4)' }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="eve-note w-full max-w-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: 'rgba(43,27,18,.2)' }}>
                  <h2 className="font-caps text-lg">Runde {lastResult.round}</h2>
                  <span className="text-xs px-2 py-1 rounded-md border font-hand">
                    {lastResult.infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
                  </span>
                </div>

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

                <div className="flex justify-between items-center pt-2 border-t-2 font-caps text-lg" style={{ borderColor: 'rgba(43,27,18,.2)' }}>
                  <span>Dein Gewinn</span>
                  <span>{(myLastBuyerResult?.earnings ?? 0).toFixed(2)} €</span>
                </div>
                <div className="text-center text-xs opacity-60">
                  {isLastRound ? 'Spiel endet…' : 'Warte auf nächste Runde…'}
                </div>
              </div>
            </div>
          </div>
        )}

        {session.phase === 'game-end' && (
          <div className="eve-note p-6">
            <h2 className="font-caps text-3xl mb-4">Alle Ergebnisse</h2>
            <ProfitTable results={session.results} sellers={sellers} buyers={buyers} />
          </div>
        )}
      </div>
    </div>
  )
}
