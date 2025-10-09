export interface Point {
  x: number;
  y: number;
}

/**
 * Trie les points autour d'un centre dans le sens horaire.
 * @param points Tableau de points non ordonnés
 * @param centerX Coordonnée x du centre
 * @param centerY Coordonnée y du centre
 * @returns Nouveau tableau de points triés
 */
export function sortPointsClockwise(
  points: Point[],
  centerX: number,
  centerY: number
): Point[] {
  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - centerY, a.x - centerX);
    const angleB = Math.atan2(b.y - centerY, b.x - centerX);
    return angleA - angleB;
  });
}

/**
 * Simplifie un polygone en appliquant l'algorithme de Douglas-Peucker.
 * @param points Liste initiale de points
 * @param tolerance Seuil de tolérance de la simplification
 * @returns Polygone simplifié
 */
export function simplifyPolygon(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  function perpendicularDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      );
    }

    const t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      (dx * dx + dy * dy);

    if (t < 0) {
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      );
    }
    if (t > 1) {
      return Math.sqrt(
        (point.x - lineEnd.x) ** 2 + (point.y - lineEnd.y) ** 2
      );
    }

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
  }

  function douglasPeucker(
    pts: Point[],
    startIndex: number,
    endIndex: number,
    tol: number
  ): Point[] {
    if (endIndex <= startIndex + 1) {
      const point = pts[startIndex];
      return point ? [point] : [];
    }

    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = startIndex + 1; i < endIndex; i++) {
      const point = pts[i];
      const startPoint = pts[startIndex];
      const endPoint = pts[endIndex];
      if (point && startPoint && endPoint) {
        const distance = perpendicularDistance(point, startPoint, endPoint);
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }
    }

    let result: Point[] = [];
    if (maxDistance > tol) {
      const left = douglasPeucker(pts, startIndex, maxIndex, tol);
      const right = douglasPeucker(pts, maxIndex, endIndex, tol);
      result = [...left, ...right];
    } else {
      const startPoint = pts[startIndex];
      const endPoint = pts[endIndex];
      if (startPoint && endPoint) {
        result = [startPoint, endPoint];
      }
    }

    return result;
  }

  const result = douglasPeucker(points, 0, points.length - 1, tolerance);

  const lastResult = result[result.length - 1];
  const lastPoint = points[points.length - 1];

  if (lastResult && lastPoint && (lastResult.x !== lastPoint.x || lastResult.y !== lastPoint.y)) {
    result.push(lastPoint);
  }

  return result;
}
