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
    <div className="panel-warm p-6">
      <div className="label mb-3">Session-Code</div>

      {/* Code in big display font */}
      <div className="font-mono font-bold text-lemon-500 tracking-[0.22em] leading-none mb-5"
           style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
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
          {copied ? (
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <polyline points="1.5,5.5 4,9 9.5,1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Kopiert
            </span>
          ) : 'Kopieren'}
        </button>
      </div>
    </div>
  )
}
