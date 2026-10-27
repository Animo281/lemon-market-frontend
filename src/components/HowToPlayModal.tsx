import { useEffect, useRef } from 'react'
import { Role } from '../shared/types'

interface Props {
  role: Role
  onClose: () => void
}

// Purely mechanical "how do I operate this" explainer, shown once per role
// at the start of a game (PlayerView.tsx) — deliberately does NOT explain
// the experiment's actual lesson (information asymmetry / the lemons
// problem). Same overlay pattern as ConfirmDialog.tsx (focus-on-open,
// Escape-to-close, backdrop click).
export default function HowToPlayModal({ role, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    triggerRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mkt-950/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        className="panel p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <div className="label mb-1">Wie funktioniert's?</div>
          <h2 id="howto-title" className="text-lg font-bold text-mkt-100">
            {role === 'seller' ? 'Du bist Verkäufer:in' : 'Du bist Käufer:in'}
          </h2>
        </div>

        {role === 'seller' ? <SellerSteps /> : <BuyerSteps />}

        <button ref={closeRef} type="button" onClick={onClose} className="btn-primary w-full mt-1">
          Los geht's →
        </button>
      </div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-mkt-850 border border-mkt-700 text-mkt-300 text-xs font-bold font-mono flex items-center justify-center">
        {n}
      </span>
      <p className="text-mkt-300 text-sm leading-snug">{children}</p>
    </div>
  )
}

function SellerSteps() {
  return (
    <div className="flex flex-col gap-3">
      <Step n={1}>
        Wähle eine Kiste: <b className="text-coral-400">Q1</b> (deutliche Mängel, günstig im Einkauf),{' '}
        <b className="text-lemon-400">Q2</b> (geringe Mängel) oder <b className="text-lime-400">Q3</b> (perfekt,
        teuer im Einkauf). Du kannst 1 oder 2 Kisten nehmen.
      </Step>
      <Step n={2}>
        Lege am Schild deinen Verkaufspreis fest — er darf nicht unter deinen Einkaufskosten liegen.
      </Step>
      <Step n={3}>
        Hänge das Schild auf. Danach warten die Käufer:innen und entscheiden, ob sie bei dir kaufen.
      </Step>
      <Step n={4}>
        Am Rundenende siehst du, was verkauft wurde und wie viel Gewinn du gemacht hast.
      </Step>
    </div>
  )
}

function BuyerSteps() {
  return (
    <div className="flex flex-col gap-3">
      <Step n={1}>
        Du siehst die Preise an allen Ständen (je nach Runde auch die Qualität — manchmal erst am Rundenende).
      </Step>
      <Step n={2}>
        Wenn du an der Reihe bist ("Du bist dran"), hast du ein Zeitlimit: Wähle einen Stand zum Kaufen oder
        klicke "Nicht kaufen".
      </Step>
      <Step n={3}>
        <b className="text-coral-400">Q1</b>, <b className="text-lemon-400">Q2</b> und{' '}
        <b className="text-lime-400">Q3</b> stehen für die Qualität der Zitronen — höhere Qualität ist dir mehr
        wert.
      </Step>
      <Step n={4}>
        Dein <b className="text-mkt-100">Käuferwert</b> ist, was dir eine Zitrone dieser Qualität persönlich wert
        ist (steht oben in der Leiste). Er ist für jede Qualitätsstufe fest vorgegeben und ändert sich nicht.
      </Step>
      <Step n={5}>
        Am Rundenende siehst du, was du gekauft hast und wie viel Gewinn du gemacht hast: Käuferwert minus
        bezahlter Preis.
      </Step>
    </div>
  )
}
