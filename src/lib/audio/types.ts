/**
 * Types pour le système audio
 */

/**
 * Options de lecture audio
 */
export interface AudioOptions {
    /** Volume de 0.0 à 1.0 */
    volume?: number;
    /** Répéter en boucle */
    loop?: boolean;
    /** Lecture automatique */
    autoplay?: boolean;
    /** Identifiant unique (utilise le nom du fichier par défaut) */
    id?: string;
}
