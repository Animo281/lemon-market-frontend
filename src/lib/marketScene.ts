import type { CSSProperties } from 'react'
import { Grade } from '../shared/types'
import marketEveningUrl from '../assets/market/market-evening.webp'
import cratePerfect from '../assets/market/crate-perfect.png'
import crateMinor from '../assets/market/crate-minor.png'
import cratePoor from '../assets/market/crate-poor.png'

export const MARKET_SCENE_IMAGE = marketEveningUrl

// Background scene is a fixed 1024×572 illustration. Every position below is defined
// in image pixels and converted to % so it scales with the container, per HANDOFF.md.
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

// Positions in image pixels, taken from HANDOFF.md's "Stand-Slots pro Marktgasse" table.
export const STALL_SLOTS: StallSlotGeometry[] = [
  {
    cx: 116,
    name: { box: [72, 222, 119, 51], rotationDeg: -2 },
    offer: { x: 128, y: 418, rotationDeg: -1.6 },
    dim: [8, 196, 222, 280],
  },
  {
    cx: 334,
    name: { box: [275, 228, 117, 42], rotationDeg: 0 },
    offer: { x: 334, y: 423, rotationDeg: 0.6 },
    dim: [234, 186, 202, 290],
  },
  {
    cx: 528,
    name: { box: [466, 227, 123, 31], rotationDeg: 0, style: 'lemonade' },
    offer: { x: 530, y: 418, rotationDeg: -2, style: 'chalk' },
    dim: [444, 204, 172, 274],
    cover: [577, 219],
  },
  {
    cx: 725,
    name: { box: [675, 224, 111, 51], rotationDeg: 3.4 },
    offer: { x: 712, y: 410, rotationDeg: 2 },
    dim: [628, 196, 200, 282],
  },
]

export const BUY_BUTTON_Y = 498
export const CLOSED_BOARD_Y = 320

// Backend grade 3 is the best lemon (BUYER_VALUES[3] = 13.60€), grade 1 the worst — the
// opposite of the mockup's painted "Qualität 1 = perfekt" sorting station. We keep the
// backend's numbering (it's what sellers, the admin view, and the profit tables all use)
// and remap which crate artwork represents which grade instead of relaying the image's
// own labels. See HANDOFF.md "Offene Punkte" #1 and the plan's "Qualitäts-Mapping".
export const CRATE_BY_GRADE: Record<Grade, string> = {
  3: cratePerfect, // was crate-q1.png — pralle, makellose Zitronen
  2: crateMinor,
  1: cratePoor, // was crate-q3.png — fleckige Zitronen
}

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
