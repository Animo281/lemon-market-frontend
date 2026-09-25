import { PublicSession, Role } from '../shared/types'
import { cropCoverStyle, cropStyle, MARKET_SCENE_IMAGE, STALL_CROPS, STALL_NAMES } from '../lib/marketScene'
import { MiniLemonIcon } from './buyer/icons'

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

function BuyerSlot({ index, takenBy, selectedRole, selectedSlot, onSelect }: Omit<SlotProps, 'role'>) {
  const isSelected = selectedRole === 'buyer' && selectedSlot === index

  if (takenBy) {
    return (
      <div className="px-3 py-2.5 rounded-xl border border-mkt-800 bg-mkt-850/40 text-xs text-mkt-500 text-center cursor-not-allowed truncate">
        {takenBy}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect('buyer', index)}
      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
        isSelected
          ? 'bg-ice-500/15 border-ice-500/60 text-ice-400'
          : 'bg-mkt-850 border-mkt-800 text-mkt-300 hover:border-mkt-600 hover:text-mkt-100'
      }`}
    >
      K{index + 1}
    </button>
  )
}

// Seller slots double as a preview of the Abendmarkt stand a seller will
// actually stand behind — a scene-crop thumbnail instead of a plain "V1/V2"
// button, per the plan's "Stand-Auswahl beim Beitreten". JoinView itself
// stays in the dark Nacht-Markt chrome (mkt-* surfaces, dark border) so only
// the thumbnail brings the illustrated scene in, not the whole page.
function SellerSlot({ index, takenBy, selectedRole, selectedSlot, onSelect }: Omit<SlotProps, 'role'>) {
  const isSelected = selectedRole === 'seller' && selectedSlot === index
  const cropIndex = index % 4
  const stallName = STALL_NAMES[cropIndex]

  return (
    <button
      type="button"
      disabled={!!takenBy}
      aria-pressed={isSelected}
      aria-label={`${stallName}${takenBy ? `, vergeben an ${takenBy}` : isSelected ? ', ausgewählt' : ', frei'}`}
      onClick={() => onSelect('seller', index)}
      className={`rounded-xl border p-2 text-center transition-all ${
        takenBy
          ? 'border-mkt-800 bg-mkt-850/40 cursor-not-allowed'
          : isSelected
            ? 'bg-lemon-500/15 border-lemon-500/60'
            : 'bg-mkt-850 border-mkt-800 hover:border-mkt-600'
      }`}
    >
      <div
        className={`relative rounded-lg border border-mkt-800 overflow-hidden ${takenBy ? 'grayscale brightness-75' : ''}`}
        style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, aspectRatio: '206 / 250', ...cropStyle(STALL_CROPS[cropIndex]) }}
      >
        {cropIndex === 2 && <span style={cropCoverStyle(STALL_CROPS[2])}><MiniLemonIcon /></span>}
      </div>
      <div className={`mt-1.5 text-xs font-semibold truncate ${isSelected ? 'text-lemon-400' : 'text-mkt-200'}`}>{stallName}</div>
      <div className="text-[10px] text-mkt-500 truncate">
        {takenBy ? `Vergeben an ${takenBy}` : isSelected ? 'Dein Stand' : 'Frei'}
      </div>
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
          <span className="label text-lemon-500">
            Verkäufer · {takenSellerSlots.size}/{session.numSellers} belegt
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md">
          {Array.from({ length: session.numSellers }, (_, i) => (
            <SellerSlot
              key={i} index={i}
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
          <span className="label text-ice-500">
            Käufer · {takenBuyerSlots.size}/{session.numBuyers} belegt
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: session.numBuyers }, (_, i) => (
            <BuyerSlot
              key={i} index={i}
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
