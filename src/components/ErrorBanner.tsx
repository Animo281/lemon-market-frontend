// Canonical error treatment per DESIGN.md §4.10 — replaces the half-dozen
// slightly different ad-hoc error blocks that used to be copy-pasted across
// views. role="alert" so assistive tech actually announces it; previously no
// error in the app was announced at all.
interface Props {
  message: string
}

export default function ErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 text-coral-400 text-sm font-mono bg-coral-500/8 border border-coral-500/25 rounded-xl px-4 py-3"
    >
      <span className="flex-1">{message}</span>
    </div>
  )
}
