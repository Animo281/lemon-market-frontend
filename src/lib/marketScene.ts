import type { CSSProperties } from 'react'
import { Grade } from '../shared/types'
import marketEveningUniformUrl from '../assets/market/market-evening-uniform.webp'
import cratePerfect from '../assets/market/crate-perfect.png'
import crateMinor from '../assets/market/crate-minor.png'
import cratePoor from '../assets/market/crate-poor.png'

// Feedback from a live test round: "Alle Stände sehen identisch aus (kein
// visueller Hinweis auf Qualität)" — the original scene painted 4 distinct
// vendor stalls (different wares, different look), which itself read as a
// quality cue before anyone priced anything. This asset clones one stall's
// art (the plain Zitronen-Sorbet tent) over the other 3 slot positions —
// see scripts/make-uniform-stalls.py for how it was generated.
export const MARKET_SCENE_IMAGE = marketEveningUniformUrl

// Background scene is a fixed 1024×572 illustration. Every position below is defined
// in image pixels and converted to % so it scales with the container, per
// docs/lemon-market-ui/HANDOFF.md.
export const SCENE_W = 1024
export const SCENE_H = 572
export const SELLERS_PER_LANE = 4

const pct = (v: number, base: number) => `${(v / base) * 100}%`

/** Absolute position for a point given in image pixels. */
export function atStyle(x: number, y: number): CSSProperties {
  return { position: 'absolute', left: pct(x, SCENE_W), top: pct(y, SCENE_H) }
}

/** Absolute box for a [x, y, w, h] rect given in image pixels. */
export function boxStyle([x, y, w, h]: [number, number, number, number]): CSSProperties {
  return {
    position: 'absolute',
    left: pct(x, SCENE_W), top: pct(y, SCENE_H),
    width: pct(w, SCENE_W), height: pct(h, SCENE_H),
  }
}

/** Same as atStyle/boxStyle, plus the `--r` custom property the scene's
 * rotated elements (name tags, offer cards) read via `transform: rotate(var(--r))`. */
export function withRotation(style: CSSProperties, rotationDeg: number): CSSProperties {
  return { ...style, '--r': `${rotationDeg}deg` } as CSSProperties
}

export interface StallSlotGeometry {
  cx: number
  name: { box: [number, number, number, number]; rotationDeg: number; style?: 'lemonade' }
  offer: { x: number; y: number; rotationDeg: number; style?: 'chalk' }
  dim: [number, number, number, number]
  cover?: [number, number]
}

// All 4 stalls now share one cloned design (the former slot-1 Zitronen-Sorbet
// tent — see MARKET_SCENE_IMAGE's comment), so every slot reuses slot 1's own
// name/offer/dim geometry, just re-centered on its own cx. None of the other
// stalls' former one-off styling ('lemonade' name layout, 'chalk' offer
// board, the Lemonade-Wagen icon 'cover') applies anymore.
const TEMPLATE_CX = 334
const TEMPLATE_NAME_BOX: [number, number, number, number] = [275, 228, 117, 42]
const TEMPLATE_OFFER = { x: 334, y: 423, rotationDeg: 0.6 }
const TEMPLATE_DIM: [number, number, number, number] = [234, 186, 202, 290]

function stallSlotAt(cx: number): StallSlotGeometry {
  const dx = cx - TEMPLATE_CX
  return {
    cx,
    name: { box: [TEMPLATE_NAME_BOX[0] + dx, TEMPLATE_NAME_BOX[1], TEMPLATE_NAME_BOX[2], TEMPLATE_NAME_BOX[3]], rotationDeg: 0 },
    offer: { x: TEMPLATE_OFFER.x + dx, y: TEMPLATE_OFFER.y, rotationDeg: TEMPLATE_OFFER.rotationDeg },
    dim: [TEMPLATE_DIM[0] + dx, TEMPLATE_DIM[1], TEMPLATE_DIM[2], TEMPLATE_DIM[3]],
  }
}

// cx values, taken from docs/lemon-market-ui/HANDOFF.md's original
// "Stand-Slots pro Marktgasse" table — only the per-slot art changed.
export const STALL_SLOTS: StallSlotGeometry[] = [116, 334, 528, 725].map(stallSlotAt)

export const BUY_BUTTON_Y = 498
export const CLOSED_BOARD_Y = 320

// Backend grade 3 is always the best lemon (highest buyerValues entry, 13.60€ under the
// Holt & Sherman defaults — host-configurable per session, see shared/constants.ts),
// grade 1 the worst — the opposite of the mockup's painted "Qualität 1 = perfekt"
// sorting station. We keep the
// backend's numbering (it's what sellers, the admin view, and the profit tables all use)
// and remap which crate artwork represents which grade instead of relaying the image's
// own labels. See docs/lemon-market-ui/HANDOFF.md "Offene Punkte" #1 and the
// plan's "Qualitäts-Mapping".
export const CRATE_BY_GRADE: Record<Grade, string> = {
  3: cratePerfect, // was crate-q1.png — pralle, makellose Zitronen
  2: crateMinor,
  1: cratePoor, // was crate-q3.png — fleckige Zitronen
}

export const GRADES_BEST_FIRST: Grade[] = [3, 2, 1]

export const QUALITY_LABEL: Record<Grade, { label: string; text: string; paper: string; chalk: string }> = {
  3: { label: 'Qualität 3', text: 'Perfekt, makellos', paper: '#2F5E12', chalk: '#B9E28A' },
  2: { label: 'Qualität 2', text: 'Geringe Mängel', paper: '#7A5A06', chalk: '#F4D46A' },
  1: { label: 'Qualität 1', text: 'Deutliche Mängel', paper: '#8E2A14', chalk: '#F4A58A' },
}

// The painted "ZITRONEN SORTIERSTATION" backdrop carries its own three label cards with
// the (wrong, for us) Qualität 1/2/3 order. These boxes overlay corrected labels on top,
// measured directly from assets/market-evening.png. The station itself is legend-only —
// never a seller slot — and stays visible in every phase.
export const SORTING_STATION_CARDS: Array<{ grade: Grade; box: [number, number, number, number] }> = [
  { grade: 3, box: [828, 327, 58, 37] }, // leftmost card sits over the pristine crate art
  { grade: 2, box: [892, 327, 58, 38] },
  { grade: 1, box: [956, 328, 58, 36] }, // rightmost card sits over the blemished crate art
]

export function laneCount(numSellers: number): number {
  return Math.max(1, Math.ceil(numSellers / SELLERS_PER_LANE))
}

// ─────────────────────────────────────────────────────────────────────────
// Seller-view geometry, from docs/lemon-market-ui/HANDOFF-verkaeufer.md.
// ─────────────────────────────────────────────────────────────────────────

/** Same three background zooms the seller flow steps through: choosing a
 * stand, choosing a crate at the sorting station, and standing behind the
 * counter. Screen 4 (the live market round) reuses the plain scene at
 * 100%/100% like the buyer view, so it isn't listed here. */
export const SCENE_VIEWS = {
  stallPick: { backgroundSize: '100% 100%', filter: 'brightness(.4) blur(3px) saturate(.8)' },
  sorting: { backgroundSize: '260% 260%', backgroundPosition: '100% 56%', filter: 'brightness(.42) blur(3px) saturate(.8)' },
  counter: { backgroundSize: '135% 135%', backgroundPosition: '31% 69%', filter: 'brightness(.55) blur(2.5px)' },
} as const satisfies Record<string, CSSProperties>

// The "Stand wählen" crop cards show a 206×250 window of the scene per
// stall, cut from the same 1024×572 illustration — no separate images.
export const CROP_W = 206
export const CROP_H = 250
export const CROP_Y = 196
export const STALL_CROPS = [13, 231, 425, 625] // x offset per stall, same order as STALL_SLOTS

// Stand titles, same order as STALL_SLOTS/STALL_CROPS — used on the
// seller-slot join cards (JoinSlotPicker) and the seller's own lobby "Dein
// Stand" card. All 4 stalls now share the same art (see MARKET_SCENE_IMAGE's
// comment), so these are just numbered rather than named after a design.
export const STALL_NAMES = ['Stand 1', 'Stand 2', 'Stand 3', 'Stand 4']

/** Stall name + its Marktgasse (1-based) for a seller slot. There are only
 * 4 stall slot positions (STALL_NAMES/STALL_CROPS), so sessions with >4
 * sellers reuse them across lanes — e.g. two "Stand 1" cards for slot 0 and
 * slot 4. `lane` disambiguates those in the UI; it's null when everyone fits
 * in one lane (laneCount === 1), so small sessions render exactly as before. */
export function stallInfo(slotIndex: number, numSellers: number): { cropIndex: number; name: string; lane: number | null } {
  const cropIndex = slotIndex % SELLERS_PER_LANE
  return {
    cropIndex,
    name: STALL_NAMES[cropIndex],
    lane: laneCount(numSellers) > 1 ? Math.floor(slotIndex / SELLERS_PER_LANE) + 1 : null,
  }
}

/** background-size/background-position for one stall's crop card, per
 * HANDOFF-verkaeufer.md's "Ausschnitt 206×250 Bildpixel" formula. */
export function cropStyle(cropX: number): CSSProperties {
  return {
    backgroundSize: `${(SCENE_W / CROP_W) * 100}% ${(SCENE_H / CROP_H) * 100}%`,
    backgroundPosition: `${(cropX / (SCENE_W - CROP_W)) * 100}% ${(CROP_Y / (SCENE_H - CROP_H)) * 100}%`,
  }
}

/** Status chips in the market round (Screen 4) sit at the same height as the
 * buy button in the buyer scene — just without a button underneath. */
export const CHIP_Y = BUY_BUTTON_Y
