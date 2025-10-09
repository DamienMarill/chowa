/**
 * Store de gestion de l'état du jeu
 * Utilise les runes Svelte 5 pour la réactivité
 */

import { DEFAULT_PAPERS } from '../config/constants';

// State avec runes Svelte 5
let papers = $state({ ...DEFAULT_PAPERS } as Record<string, number>);
let selectedPaper = $state<string | null>(null);

// Derived - calcul réactif du total collecté
const totalCollected = $derived(
    Object.values(papers).reduce((sum, count) => sum + count, 0)
);

// Actions

/**
 * Collecter un paper (incrémenter son compteur)
 */
export function collectPaper(paperName: string) {
    if (papers[paperName] !== undefined) {
        papers[paperName]++;
    }
}

/**
 * Sélectionner un paper pour afficher son modal
 */
export function selectPaper(paperName: string) {
    selectedPaper = paperName;
}

/**
 * Désélectionner le paper actuel
 */
export function clearSelection() {
    selectedPaper = null;
}

/**
 * Obtenir le compteur d'un paper spécifique
 */
export function getPaperCount(paperName: string): number {
    return papers[paperName] ?? 0;
}

/**
 * Réinitialiser tous les compteurs
 */
export function resetPapers() {
    papers = { ...DEFAULT_PAPERS };
}

// Export du state (getters reactifs)
export const gameState = {
    get papers() { return papers; },
    get selectedPaper() { return selectedPaper; },
    get totalCollected() { return totalCollected; },
    collectPaper,
    selectPaper,
    clearSelection,
    getPaperCount,
    resetPapers
};
