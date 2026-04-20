import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession, Role } from '../shared/types'
import { api } from '../api/client'
import { storage, sessionIndex } from '../lib/storage'
import JoinSlotPicker from '../components/JoinSlotPicker'

export default function JoinView() {
  const { code: codeParam } = useParams<{ code?: string }>()
  const navigate = useNavigate()

  const [code, setCode] = useState(codeParam?.toUpperCase() ?? '')
  const [session, setSession] = useState<PublicSession | null>(null)
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code || code.length !== 4) return
    const load = async () => {
      try {
        const s = await api.getSession(code)
        setSession(s)
        setError('')
      } catch {
        setSession(null)
      }
    }
    load()
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [code])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedRole === null || selectedSlot === null || !session) return
    setLoading(true)
    setError('')
    try {
      const { playerToken, playerId } = await api.joinSession(code, name.trim(), selectedRole, selectedSlot)
      storage.setPlayerToken(code, playerToken)
      storage.setPlayerId(code, playerId)
      sessionIndex.save(code, {
        playerId,
        playerToken,
        name: name.trim(),
        role: selectedRole,
        slotIndex: selectedSlot,
        lastJoined: new Date().toISOString(),
      })
      navigate(`/play/${code}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length === 4) navigate(`/join/${code}`)
  }

  return (
    <div className="min-h-screen graph-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 animate-fade-up">

        {/* Page title */}
        <div className="mb-6">
          <div className="label mb-1.5">Market for Lemons</div>
          <h1 className="font-display text-4xl font-bold text-gold-500">
            Session<br />beitreten
          </h1>
        </div>

        {/* Code entry (only when no code in URL) */}
        {!codeParam && (
          <form onSubmit={handleCodeSubmit} className="panel p-6 space-y-4">
            <label className="flex flex-col gap-2">
              <span className="label">Session-Code</span>
              <input
                type="text" maxLength={4} value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="bg-mkt-850 border border-mkt-800 rounded-xl px-4 py-4 font-mono text-5xl text-center text-gold-500 font-bold tracking-[0.3em] focus:outline-none focus:border-gold-500/50 placeholder:text-mkt-700 uppercase transition-colors"
                placeholder="XXXX"
                autoFocus
              />
            </label>
            <button
              type="submit" disabled={code.length < 4}
              className="btn-primary w-full"
            >
              Weiter →
            </button>
          </form>
        )}

        {/* Session join form */}
        {session ? (
          <form onSubmit={handleJoin} className="panel p-6 space-y-5 animate-scale-in">
            {/* Code badge */}
            <div className="flex items-center gap-3 pb-4 border-b border-mkt-800">
              <span className="label">Code</span>
              <span className="font-mono font-bold text-gold-500 tracking-[0.2em] text-lg">{code}</span>
              <span className="ml-auto label">
                {session.players.length}/{session.numSellers + session.numBuyers} Spieler
              </span>
            </div>

            {/* Name input */}
            <label className="flex flex-col gap-1.5">
              <span className="label">Dein Name</span>
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name eingeben"
                className="input-base w-full"
                autoFocus={!!codeParam}
                maxLength={24}
              />
            </label>

            {/* Slot picker */}
            <JoinSlotPicker
              session={session}
              selectedRole={selectedRole}
              selectedSlot={selectedSlot}
              onSelect={(role, slot) => { setSelectedRole(role); setSelectedSlot(slot) }}
            />

            {error && <p className="text-coral-400 text-xs font-mono">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim() || selectedRole === null || selectedSlot === null}
              className="btn-primary w-full"
            >
              {loading ? 'Beitreten…' : 'Beitreten →'}
            </button>
          </form>
        ) : code.length === 4 ? (
          <div className="panel p-8 text-center">
            <div className="flex items-center justify-center gap-2.5 text-mkt-400 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mkt-400" />
              </span>
              Lade Session…
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
