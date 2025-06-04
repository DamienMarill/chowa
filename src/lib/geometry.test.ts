import { describe, it, expect } from 'vitest'
import { sortPointsClockwise, simplifyPolygon, Point } from './geometry'

describe('sortPointsClockwise', () => {
  it('should sort points around center clockwise', () => {
    const points: Point[] = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 }
    ]
    const sorted = sortPointsClockwise(points, 0, 0)
    expect(sorted[0]).toEqual({ x: 0, y: -1 })
    expect(sorted[1]).toEqual({ x: 1, y: 0 })
    expect(sorted[2]).toEqual({ x: 0, y: 1 })
    expect(sorted[3]).toEqual({ x: -1, y: 0 })
  })
})

describe('simplifyPolygon', () => {
  it('should keep endpoints when line is straight', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0.01 },
      { x: 2, y: 0 }
    ]
    const simplified = simplifyPolygon(points, 0.1)
    expect(simplified).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 }
    ])
  })
})
