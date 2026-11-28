import type { Rect } from '@embedpdf/models'

function unionRect(target: Rect, next: Rect): Rect {
  const left = Math.min(target.origin.x, next.origin.x)
  const top = Math.min(target.origin.y, next.origin.y)
  const right = Math.max(target.origin.x + target.size.width, next.origin.x + next.size.width)
  const bottom = Math.max(target.origin.y + target.size.height, next.origin.y + next.size.height)
  return {
    origin: { x: left, y: top },
    size: { width: right - left, height: bottom - top },
  }
}

function copyRect(rect: Rect): Rect {
  return {
    origin: { x: rect.origin.x, y: rect.origin.y },
    size: { width: rect.size.width, height: rect.size.height },
  }
}

function sameLine(line: Rect, rect: Rect): boolean {
  const centerY = rect.origin.y + rect.size.height / 2
  return centerY >= line.origin.y - 0.5 && centerY <= line.origin.y + line.size.height + 0.5
}

/** Merge same-line fragments into one light highlight while preserving separate lines and distant words. */
export function mergeLineRects(rects: Rect[]): Rect[] {
  const lines: Rect[][] = []

  for (const rect of [...rects].sort((a, b) => a.origin.y - b.origin.y || a.origin.x - b.origin.x)) {
    const line = lines.find((candidate) => candidate.some((member) => sameLine(member, rect)))
    if (line) line.push(rect)
    else lines.push([rect])
  }

  return lines.flatMap((line) => {
    const merged: Rect[] = []
    for (const rect of [...line].sort((a, b) => a.origin.x - b.origin.x)) {
      const current = merged.at(-1)
      if (!current) {
        merged.push(copyRect(rect))
        continue
      }

      const currentRight = current.origin.x + current.size.width
      const horizontalGap = rect.origin.x - currentRight
      const nearHorizontally = horizontalGap < Math.max(current.size.height, rect.size.height) * 0.6
      if (nearHorizontally) merged[merged.length - 1] = unionRect(current, rect)
      else merged.push(copyRect(rect))
    }
    return merged
  })
}
