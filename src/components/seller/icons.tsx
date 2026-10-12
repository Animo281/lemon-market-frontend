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
