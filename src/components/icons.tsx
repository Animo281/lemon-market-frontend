// Shared checkmark used across AdminView/PlayerView/SessionCodeDisplay for
// "done"/"confirmed" states. Points are a lookup, not an algorithmic scale,
// so each size stays pixel-identical to how it was hand-tuned before extraction.
const CHECK_POINTS: Record<number, string> = {
  10: '1.5,5 3.5,8 8.5,1.5',
  11: '1.5,5.5 4,9 9.5,1.5',
  18: '3,9.5 7,13.5 15,4.5',
  20: '4,10.5 8,15 16,5',
}

interface CheckIconProps {
  size: 10 | 11 | 18 | 20
  strokeWidth?: number
  className?: string
}

export function CheckIcon({ size, strokeWidth = 1.5, className }: CheckIconProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true" className={className}>
      <polyline points={CHECK_POINTS[size]} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
