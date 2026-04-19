import { useState } from 'react'

interface Props {
  code: string
}

export default function SessionCodeDisplay({ code }: Props) {
  const [copied, setCopied] = useState(false)
  const joinUrl = `${window.location.origin}/join/${code}`

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel p-6">
      <div className="label mb-3">Session-Code</div>
      <div className="font-display text-[4.5rem] font-bold text-gold-500 tracking-[0.18em] mb-5 leading-none">
        {code}
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly value={joinUrl}
          className="flex-1 bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-2 font-mono text-xs text-mkt-400 focus:outline-none select-all cursor-text"
        />
        <button
          onClick={copyLink}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            copied
              ? 'bg-lime-500/15 border-lime-500/40 text-lime-400'
              : 'bg-mkt-850 border-mkt-700 text-mkt-200 hover:border-mkt-600 hover:text-mkt-100'
          }`}
        >
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
      </div>
    </div>
  )
}
