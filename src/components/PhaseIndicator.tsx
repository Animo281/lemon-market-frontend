import { InfoMode } from '../../../shared/types'

interface Props {
  round: number
  total: number
  infoMode: InfoMode
}

export default function PhaseIndicator({ round, total, infoMode }: Props) {
  const full = infoMode === 'full'
  return (
    <div className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 font-mono text-sm transition-colors ${
      full
        ? 'bg-lime-500/8 border-lime-500/35 text-lime-400'
        : 'bg-coral-500/8 border-coral-500/35 text-coral-400'
    }`}>
      {/* Animated status dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`dot-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
          full ? 'bg-lime-400' : 'bg-coral-400'
        }`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${
          full ? 'bg-lime-400' : 'bg-coral-400'
        }`} />
      </span>

      <span className="text-mkt-300">
        Runde <strong className="text-mkt-100">{round}</strong>
        <span className="text-mkt-500">/{total}</span>
      </span>

      <span className={`text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-md border ${
        full
          ? 'border-lime-500/25 bg-lime-500/10 text-lime-300'
          : 'border-coral-500/25 bg-coral-500/10 text-coral-300'
      }`}>
        {full ? 'Volle Info' : 'Asymm. Info'}
      </span>
    </div>
  )
}
