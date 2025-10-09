/**
 * Types pour le système AR et hitbox
 */

/**
 * Point 2D pour les contours
 */
export interface Point2D {
    x: number;
    y: number;
}

/**
 * Hitbox d'un élément AR avec son contour détecté
 */
export interface Hitbox {
    /** Élément A-Frame associé */
    aframeEl: HTMLElement;
    /** Points du contour en coordonnées écran */
    screenPoints: Point2D[];
    /** Image utilisée pour la détection */
    image: string;
}
