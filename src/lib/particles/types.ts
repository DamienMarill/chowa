/**
 * Types pour le système de particules AR (A-Frame)
 */

/**
 * Interface d'une particule pour A-Frame
 */
export interface Particle {
    /** Identifiant unique */
    id: number;
    /** Position X dans l'espace 3D */
    x: number;
    /** Position Y dans l'espace 3D */
    y: number;
    /** Position Z (profondeur) dans l'espace 3D */
    z: number;
    /** Rotation X */
    rotationX: number;
    /** Rotation Y */
    rotationY: number;
    /** Rotation Z */
    rotationZ: number;
    /** Échelle de la particule */
    scale: number;
    /** Vitesse de chute verticale */
    speedY: number;
    /** Vitesse de déplacement horizontal */
    speedX: number;
    /** Vitesse de rotation X */
    speedRotationX: number;
    /** Vitesse de rotation Y */
    speedRotationY: number;
    /** Vitesse de rotation Z */
    speedRotationZ: number;
    /** Fréquence du balancement */
    swayFrequency: number;
    /** Amplitude du balancement */
    swayAmplitude: number;
    /** Décalage pour l'animation de balancement */
    swayOffset: number;
    /** Chemin vers l'image */
    image: string;
    /** Référence à l'élément A-Frame */
    element: HTMLElement | null;
}
