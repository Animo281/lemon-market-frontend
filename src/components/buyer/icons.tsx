// Hand-drawn lemon marks for the Abendmarkt scene, ported 1:1 from
// mockup-kaeuferansicht.html (brand logo + the mini-lemon that covers a
// stray icon baked into the background art, see marketScene.ts `cover`).

export function LemonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <path d="M20 2v6" stroke="#F1E4CE" strokeWidth="2" />
      <ellipse cx="20" cy="23" rx="13" ry="10" fill="#F4C542" stroke="#2B1B12" strokeWidth="2.4" />
      <ellipse cx="6.5" cy="23" rx="2.8" ry="2.2" fill="#F4C542" stroke="#2B1B12" strokeWidth="2" />
      <ellipse cx="33.5" cy="23" rx="2.8" ry="2.2" fill="#F4C542" stroke="#2B1B12" strokeWidth="2" />
      <ellipse cx="24" cy="12" rx="5.5" ry="2.4" fill="#7FA83A" stroke="#2B1B12" strokeWidth="1.8" transform="rotate(-22 24 12)" />
    </svg>
  )
}

export function MiniLemonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 30" aria-hidden="true" className={className}>
      <ellipse cx="15" cy="16" rx="10" ry="7.5" fill="#F4C542" stroke="#2B1B12" strokeWidth="2" />
      <ellipse cx="4.5" cy="16" rx="2.2" ry="1.8" fill="#F4C542" stroke="#2B1B12" strokeWidth="1.6" />
      <ellipse cx="25.5" cy="16" rx="2.2" ry="1.8" fill="#F4C542" stroke="#2B1B12" strokeWidth="1.6" />
      <ellipse cx="18" cy="7" rx="4.5" ry="2" fill="#7FA83A" stroke="#2B1B12" strokeWidth="1.4" transform="rotate(-22 18 7)" />
    </svg>
  )
}

// Covers a quality-1/2/3 crate in phase 2 (asymmetric info) — a tarp thrown
// over the goods, with a "?" where the quality would be.
export function TarpCover() {
  return (
    <svg viewBox="0 0 70 40" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 38 C2 10 8 4 18 4 L52 4 C62 4 68 10 68 38 Z"
        fill="#7B5A3C" stroke="#2B1B12" strokeWidth="2.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
      />
      <path d="M10 16 L60 16" stroke="#CDB28A" strokeWidth="1.4" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <text x="35" y="33" textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontSize="18" fill="#F1E4CE">?</text>
    </svg>
  )
}
