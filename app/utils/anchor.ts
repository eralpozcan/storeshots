import type { Anchor } from './types'

// Anchor → CSS sides. x/y are %s on the canvas. Negative values intentionally
// push past the edge for "device peeks out" effects (e.g. y: -4 with anchor
// 'bc' = element's bottom-center sits 4% past the canvas bottom edge).
export function anchorSides(anchor: Anchor, x: number, y: number): Record<string, string | undefined> {
  const sides: Record<string, string | undefined> = {}
  if (anchor.endsWith('r')) sides.right = `${x}%`
  else sides.left = `${x}%`
  if (anchor.startsWith('b')) sides.bottom = `${y}%`
  else sides.top = `${y}%`
  return sides
}

// Translate that compensates for the chosen anchor so the (x, y) point lands
// on the named element corner instead of its TL by default.
export function anchorTransform(anchor: Anchor): string {
  if (anchor === 'tc' || anchor === 'bc') return 'translateX(-50%)'
  if (anchor === 'cl' || anchor === 'cr') return 'translateY(-50%)'
  if (anchor === 'c') return 'translate(-50%, -50%)'
  return ''
}

// Combine multiple optional CSS transform parts in a deterministic order.
export function combineTransform(parts: (string | undefined | false)[]): string | undefined {
  const filtered = parts.filter(Boolean).join(' ').trim()
  return filtered || undefined
}

// Inverse of anchorSides: given an anchor and a pixel delta from a drag,
// convert that delta back into a {x, y} patch in the canvas's % units. The
// caller passes the canvas pixel dims so % is preserved across device sizes.
export function dragDeltaToPatch(
  anchor: Anchor,
  dxPx: number,
  dyPx: number,
  canvasWidthPx: number,
  canvasHeightPx: number,
): { dx: number, dy: number } {
  // Sign flips for right-anchored / bottom-anchored elements: when you drag
  // an element to the right, a right-anchored element's `x` value should
  // DECREASE (it's closer to the right edge), not increase.
  const signX = anchor.endsWith('r') ? -1 : 1
  const signY = anchor.startsWith('b') ? -1 : 1
  return {
    dx: (dxPx / canvasWidthPx) * 100 * signX,
    dy: (dyPx / canvasHeightPx) * 100 * signY,
  }
}
