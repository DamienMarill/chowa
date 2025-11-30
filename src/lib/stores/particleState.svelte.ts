/**
 * Store de gestion de l'état des particules
 * Utilise les runes Svelte 5 pour la réactivité
 */

import type { Particle } from '../particles/types';

// State avec runes Svelte 5
let particles = $state<Particle[]>([]);
let isAnimating = $state(false);
let animationFrameId = $state<number | null>(null);

// Derived - nombre de particules actives
const activeCount = $derived(particles.length);

// Actions

/**
 * Définir le tableau de particules
 */
export function setParticles(newParticles: Particle[]) {
    particles = newParticles;
}

/**
 * Ajouter une particule
 */
export function addParticle(particle: Particle) {
    particles = [...particles, particle];
}

/**
 * Retirer une particule par son ID
 */
export function removeParticle(particleId: number) {
    particles = particles.filter(p => p.id !== particleId);
}

/**
 * Mettre à jour une particule spécifique
 */
export function updateParticle(particleId: number, updates: Partial<Particle>) {
    const index = particles.findIndex(p => p.id === particleId);
    if (index !== -1) {
        particles[index] = { ...particles[index], ...updates };
    }
}

/**
 * Vider toutes les particules
 */
export function clearParticles() {
    particles = [];
}

/**
 * Définir l'état d'animation
 */
export function setAnimating(value: boolean) {
    isAnimating = value;
}

/**
 * Définir l'ID de l'animation frame
 */
export function setAnimationFrameId(id: number | null) {
    animationFrameId = id;
}

// Export du state (getters reactifs)
export const particleState = {
    get particles() { return particles; },
    get isAnimating() { return isAnimating; },
    get animationFrameId() { return animationFrameId; },
    get activeCount() { return activeCount; },
    setParticles,
    addParticle,
    removeParticle,
    updateParticle,
    clearParticles,
    setAnimating,
    setAnimationFrameId
};
