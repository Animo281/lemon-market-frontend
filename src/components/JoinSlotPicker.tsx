import { PublicSession, Role } from '../shared/types'

interface Props {
  session: PublicSession
  selectedRole: Role | null
  selectedSlot: number | null
  onSelect: (role: Role, slot: number) => void
}

interface SlotProps {
  role: Role
  index: number
  takenBy: string | undefined
  selectedRole: Role | null
  selectedSlot: number | null
  onSelect: (role: Role, slot: number) => void
}

function Slot({ role, index, takenBy, selectedRole, selectedSlot, onSelect }: SlotProps) {
  const isSelected = selectedRole === role && selectedSlot === index
  const isSeller = role === 'seller'

  if (takenBy) {
    return (
      <div className="px-3 py-2 rounded-xl border border-mkt-800 bg-mkt-850/50 font-mono text-xs text-mkt-600 text-center opacity-60 cursor-not-allowed">
        {takenBy}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(role, index)}
      className={`px-3 py-2 rounded-xl border font-mono text-xs transition-all ${
        isSelected
          ? isSeller
            ? 'bg-gold-500/15 border-gold-500/70 text-gold-400 font-bold'
            : 'bg-ice-500/15 border-ice-500/70 text-ice-400 font-bold'
          : 'bg-mkt-850 border-mkt-800 text-mkt-300 hover:border-mkt-600 hover:text-mkt-100'
      }`}
    >
      {isSeller ? 'V' : 'K'}{index + 1}
    </button>
  )
}

export default function JoinSlotPicker({ session, selectedRole, selectedSlot, onSelect }: Props) {
  const takenSellerSlots = new Map(
    session.players.filter(p => p.role === 'seller').map(p => [p.slotIndex, p.name])
  )
  const takenBuyerSlots = new Map(
    session.players.filter(p => p.role === 'buyer').map(p => [p.slotIndex, p.name])
  )

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500 mr-2 -mt-0.5 align-middle" />
          Verkäufer · {takenSellerSlots.size}/{session.numSellers} belegt
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: session.numSellers }, (_, i) => (
            <Slot
              key={i} role="seller" index={i}
              takenBy={takenSellerSlots.get(i)}
              selectedRole={selectedRole} selectedSlot={selectedSlot}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-ice-500 mr-2 -mt-0.5 align-middle" />
          Käufer · {takenBuyerSlots.size}/{session.numBuyers} belegt
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: session.numBuyers }, (_, i) => (
            <Slot
              key={i} role="buyer" index={i}
              takenBy={takenBuyerSlots.get(i)}
              selectedRole={selectedRole} selectedSlot={selectedSlot}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
