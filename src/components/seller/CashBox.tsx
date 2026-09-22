// Decorative cash box on Screen 3 ("Hinter der Theke"), ported 1:1 from
// mockup-verkaeuferansicht.html.
export default function CashBox() {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      <ellipse cx="34" cy="20" rx="12" ry="4" fill="#E9B949" stroke="#2B1B12" strokeWidth="2" />
      <ellipse cx="34" cy="15" rx="12" ry="4" fill="#E9B949" stroke="#2B1B12" strokeWidth="2" />
      <ellipse cx="34" cy="10" rx="12" ry="4" fill="#F2CB63" stroke="#2B1B12" strokeWidth="2" />
      <path d="M8 34 L112 34 L106 86 L14 86 Z" fill="#5E6B73" stroke="#2B1B12" strokeWidth="3" strokeLinejoin="round" />
      <rect x="4" y="24" width="112" height="14" rx="3" fill="#7D8B93" stroke="#2B1B12" strokeWidth="3" />
      <rect x="46" y="54" width="28" height="12" rx="3" fill="#C9D1D6" stroke="#2B1B12" strokeWidth="2.5" />
    </svg>
  )
}
