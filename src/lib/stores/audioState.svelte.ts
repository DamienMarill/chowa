/**
 * Store de gestion de l'état audio
 * Utilise les runes Svelte 5 pour la réactivité
 */

import { AUDIO_CONFIG } from '../config/constants';

// State avec runes Svelte 5
const audioInstances = $state<{ [key: string]: HTMLAudioElement }>({});

// Derived - nombre d'instances actives
const activeCount = $derived(Object.keys(audioInstances).length);

// Derived - vérifier si limite atteinte
const isLimitReached = $derived(activeCount >= AUDIO_CONFIG.MAX_INSTANCES);

// Derived - instances terminées
const endedInstances = $derived(
    Object.entries(audioInstances)
        .filter(([, audio]) => audio.ended)
        .map(([key]) => key)
);

// Actions

/**
 * Ajouter une instance audio
 */
export function addAudioInstance(id: string, audio: HTMLAudioElement) {
    audioInstances[id] = audio;
}

/**
 * Retirer une instance audio
 */
export function removeAudioInstance(id: string) {
    if (audioInstances[id]) {
        audioInstances[id].pause();
        delete audioInstances[id];
    }
}

/**
 * Obtenir une instance audio par ID
 */
export function getAudioInstance(id: string): HTMLAudioElement | undefined {
    return audioInstances[id];
}

/**
 * Vérifier si une instance existe
 */
export function hasAudioInstance(id: string): boolean {
    return id in audioInstances;
}

/**
 * Nettoyer les instances terminées
 */
export function cleanupEndedInstances(): number {
    let cleaned = 0;
    for (const key of endedInstances) {
        delete audioInstances[key];
        cleaned++;
    }
    return cleaned;
}

/**
 * Obtenir la plus ancienne instance (première clé)
 */
export function getOldestInstanceKey(): string | null {
    const keys = Object.keys(audioInstances);
    return keys.length > 0 ? keys[0] : null;
}

/**
 * Nettoyer toutes les instances
 */
export function clearAllAudio() {
    for (const key in audioInstances) {
        audioInstances[key].pause();
        delete audioInstances[key];
    }
}

// Export du state (getters reactifs)
export const audioState = {
    get instances() { return audioInstances; },
    get activeCount() { return activeCount; },
    get isLimitReached() { return isLimitReached; },
    get endedInstances() { return endedInstances; },
    addAudioInstance,
    removeAudioInstance,
    getAudioInstance,
    hasAudioInstance,
    cleanupEndedInstances,
    getOldestInstanceKey,
    clearAllAudio
};
