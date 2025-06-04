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
      return [pts[startIndex]];
    }

    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = startIndex + 1; i < endIndex; i++) {
      const distance = perpendicularDistance(pts[i], pts[startIndex], pts[endIndex]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    let result: Point[] = [];
    if (maxDistance > tol) {
      const left = douglasPeucker(pts, startIndex, maxIndex, tol);
      const right = douglasPeucker(pts, maxIndex, endIndex, tol);
      result = [...left, ...right];
    } else {
      result = [pts[startIndex], pts[endIndex]];
    }

    return result;
  }

  const result = douglasPeucker(points, 0, points.length - 1, tolerance);

  if (
    result[result.length - 1].x !== points[points.length - 1].x ||
    result[result.length - 1].y !== points[points.length - 1].y
  ) {
    result.push(points[points.length - 1]);
  }

  return result;
}
