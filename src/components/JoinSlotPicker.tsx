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
      <div className="px-3 py-2.5 rounded-xl border border-mkt-800 bg-mkt-850/40 text-xs text-mkt-600 text-center cursor-not-allowed truncate">
        {takenBy}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(role, index)}
      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
        isSelected
          ? isSeller
            ? 'bg-lemon-500/15 border-lemon-500/60 text-lemon-400'
            : 'bg-ice-500/15 border-ice-500/60 text-ice-400'
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
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-lemon-500" />
          <span className="label text-lemon-500/80">
            Verkäufer · {takenSellerSlots.size}/{session.numSellers} belegt
          </span>
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
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-ice-500" />
          <span className="label text-ice-500/80">
            Käufer · {takenBuyerSlots.size}/{session.numBuyers} belegt
          </span>
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
