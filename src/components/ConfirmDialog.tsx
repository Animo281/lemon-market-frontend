import { useEffect, useRef } from 'react'

export interface ConfirmRequest {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  action: () => void
}

interface Props {
  request: ConfirmRequest | null
  onCancel: () => void
}

// Replaces window.confirm() for admin actions (kick, info-mode toggle, skip
// buyer, force-advance) — the native dialog broke the app's styled look and
// isn't reachable via the same focus-management contract as the rest of the
// UI. role="alertdialog" + focus-trap-on-open/restore-on-close per the WAI
// dialog pattern.
export default function ConfirmDialog({ request, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!request) return
    triggerRef.current = document.activeElement
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  if (!request) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-mkt-950/80 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="panel p-6 w-full max-w-sm flex flex-col gap-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-mkt-100">{request.title}</h2>
        <p id="confirm-dialog-body" className="text-mkt-400 text-sm">{request.body}</p>
        <div className="flex gap-3 mt-1">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-secondary flex-1">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => { request.action(); onCancel() }}
            className={request.danger
              ? 'flex-1 rounded-xl px-5 py-3 font-semibold bg-coral-500/15 border border-coral-500/40 text-coral-400 hover:bg-coral-500/25 transition-all active:scale-[0.975]'
              : 'btn-primary flex-1'}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
