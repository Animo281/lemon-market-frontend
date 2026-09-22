// Hand-drawn marks for the seller flow, ported 1:1 from
// mockup-verkaeuferansicht.html — see docs/lemon-market-ui/HANDOFF-verkaeufer.md.

/** The "only you can see this" eye, used on the Kiste-wählen hint board and
 * the Kaufrunde ribbon banner. */
export function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="#F4C542" />
    </svg>
  )
}

/** One coin, flown from the offer card to the Kasse pill on a sale. */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="9.5" fill="#E9B949" stroke="#2B1B12" strokeWidth="2" />
      <circle cx="11" cy="11" r="5.5" fill="none" stroke="#9C7420" strokeWidth="1.4" />
    </svg>
  )
}
