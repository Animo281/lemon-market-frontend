import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckIcon } from './icons'

interface Props {
  code: string
}

export default function SessionCodeDisplay({ code }: Props) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const joinUrl = `${window.location.origin}/join/${code}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // navigator.clipboard throws/rejects on insecure contexts (no HTTPS)
      // or without permission — used to fail completely silently. Select
      // the text so the lecturer can still copy it manually with Ctrl+C.
      inputRef.current?.select()
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 3000)
    }
  }

  // Esc closes the fullscreen QR overlay (shown on a beamer, no mouse at hand).
  useEffect(() => {
    if (!qrOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQrOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [qrOpen])

  return (
    <div className="panel-warm p-6">
      <div className="label mb-3">Session-Code</div>

      {/* Code in big display font */}
      <div className="font-mono font-bold text-lemon-500 tracking-[0.22em] leading-none mb-5"
           style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)' }}>
        {code}
      </div>

      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => setQrOpen(true)}
          className="shrink-0 bg-white p-3 rounded-xl hover:ring-2 hover:ring-lemon-500/50 transition-all"
          aria-label="QR-Code groß anzeigen"
        >
          <QRCodeSVG value={joinUrl} size={96} level="M" aria-label="QR-Code zum Beitreten" />
        </button>
        <div className="text-xs text-mkt-400 font-mono">
          <p className="mb-1.5">Mit Handy scannen zum Beitreten</p>
          <button
            onClick={() => setQrOpen(true)}
            className="text-lemon-500 hover:text-lemon-400 font-bold underline"
          >
            QR groß zeigen
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
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
              <CheckIcon size={11} />
              Kopiert
            </span>
          ) : 'Kopieren'}
        </button>
      </div>
      {copyFailed && (
        <p className="text-coral-400 text-xs font-mono mt-2">
          Kopieren nicht möglich — Link ist markiert, mit Strg+C manuell kopieren.
        </p>
      )}

      {qrOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-8 cursor-pointer"
          onClick={() => setQrOpen(false)}
          role="button"
          aria-label="Schließen"
        >
          <div className="bg-white p-6 rounded-3xl" style={{ width: 'min(80vh, 80vw)', height: 'min(80vh, 80vw)' }}>
            <QRCodeSVG value={joinUrl} size={1} level="M" style={{ width: '100%', height: '100%' }} aria-label="QR-Code zum Beitreten" />
          </div>
          <div className="font-mono font-bold text-white tracking-[0.22em]" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
            {code}
          </div>
          <p className="text-mkt-300 text-sm font-mono">Zum Schließen tippen oder Esc drücken</p>
        </div>
      )}
    </div>
  )
}
