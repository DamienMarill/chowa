/**
 * Configuration globale de l'application Chowa
 */

// Mode debug
export const DEBUG = false;

// Animation SVG
export const TYPING_SPEED = 20; // millisecondes par caractère

// Système de particules
export const PARTICLE_CONFIG = {
    COUNT: 30, // Réduit de 50 à 30 pour meilleures performances
    SCALE: {
        MIN: 0.01,
        MAX: 0.1
    },
    SPEED: {
        Y: { MIN: 0.0005, MAX: 0.0013 },
        X: { MIN: 0.0002, MAX: 0.0005 }
    },
    SWAY: {
        FREQUENCY_MIN: 0.5,
        FREQUENCY_MAX: 1.5,
        AMPLITUDE: 0.01
    }
} as const;

// Détection de contours (hitbox)
export const CONTOUR_CONFIG = {
    ALPHA_THRESHOLD: 127, // Seuil pour pixels non transparents
    STEP: 5, // Distance entre points échantillonnés
    SIMPLIFY_TOLERANCE: 5.0, // Tolérance Douglas-Peucker
    NUM_RAYS: 36 // Nombre de rayons pour détection
} as const;

// Ratios et dimensions
export const ASSET_CONFIG = {
    RATIO_DEFAULT: 1,
    A4_RATIO: 21 / 29.7
} as const;

// Caméra et interactions
export const CAMERA_CONFIG = {
    MOVE_THRESHOLD: 0.001 // Seuil de mouvement pour update hitbox
} as const;

// Audio
export const AUDIO_CONFIG = {
    MAX_INSTANCES: 10, // Limite d'instances audio simultanées
    DEFAULT_VOLUME: 1.0
} as const;

// Papers par défaut
export const DEFAULT_PAPERS = {
    angular: 3,
    laravel: 3,
    tailwind: 2
} as const;
