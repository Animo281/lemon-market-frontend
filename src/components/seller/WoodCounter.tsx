// Decorative wood counter along the bottom of Screen 3 ("Hinter der Theke"),
// ported 1:1 from mockup-verkaeuferansicht.html.
export default function WoodCounter() {
  return (
    <svg viewBox="0 0 1024 166" preserveAspectRatio="none" aria-hidden="true">
      <rect x="-4" y="10" width="1032" height="160" fill="#8B5A2B" stroke="#2B1B12" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <rect x="-4" y="0" width="1032" height="20" fill="#A56D38" stroke="#2B1B12" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <path
        d="M0 64 H1024 M0 112 H1024 M180 20 V64 M520 64 V112 M860 20 V64 M340 112 V166 M720 112 V166"
        stroke="#6B4226" strokeWidth="3" vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
