/**
 * Types pour le système de particules
 */

/**
 * Interface d'une particule
 */
export interface Particle {
    /** Identifiant unique */
    id: number;
    /** Position X à l'écran */
    x: number;
    /** Position Y à l'écran */
    y: number;
    /** Position Z (profondeur) */
    z: number;
    /** Échelle de la particule */
    scale: number;
    /** Opacité (0-1) */
    opacity: number;
    /** Vitesse de chute verticale */
    speedY: number;
    /** Vitesse de déplacement horizontal */
    speedX: number;
    /** Décalage pour l'animation de balancement */
    swayOffset: number;
    /** Fréquence du balancement */
    swayFrequency: number;
    /** Chemin vers l'image */
    image: string;
    /** Référence à l'élément HTML (si utilisé) */
    element: HTMLElement | null;
}
