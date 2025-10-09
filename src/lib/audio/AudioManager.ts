/**
 * Gestionnaire centralisé pour la lecture audio avec pooling
 */

import { AUDIO_CONFIG } from '../config/constants';
import { audioState } from '../stores/audioState.svelte';
import type { AudioOptions } from './types';

const logger = {
    log: (...args: unknown[]) => console.log(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args)
};

export class AudioManager {
    private basePath: string;

    constructor(basePath = '/divers') {
        this.basePath = basePath;
    }

    /**
     * Joue un fichier audio avec gestion du pooling
     * @param filename - Nom du fichier audio (avec extension)
     * @param options - Options de lecture
     * @returns L'élément audio créé ou existant
     */
    play(filename: string, options: AudioOptions = {}): HTMLAudioElement {
        const {
            volume = AUDIO_CONFIG.DEFAULT_VOLUME,
            loop = false,
            autoplay = true,
            id = filename
        } = options;

        const audioPath = `${this.basePath}/${filename}`;

        // Vérifier si une instance avec cet ID existe déjà
        if (audioState.hasAudioInstance(id)) {
            const existingAudio = audioState.getAudioInstance(id)!;

            if (autoplay) {
                // Réinitialiser le temps de lecture si le son est déjà terminé
                if (existingAudio.ended) {
                    existingAudio.currentTime = 0;
                }
                existingAudio.play()
                    .catch(error => logger.error(`Erreur lors de la lecture de l'audio ${filename}:`, error));
            }
            return existingAudio;
        }

        // Limiter le nombre d'instances audio actives
        if (audioState.isLimitReached) {
            // Nettoyer les instances terminées
            const cleaned = audioState.cleanupEndedInstances();

            if (cleaned === 0) {
                // Si aucune instance terminée, supprimer la plus ancienne
                const oldestKey = audioState.getOldestInstanceKey();
                if (oldestKey) {
                    audioState.removeAudioInstance(oldestKey);
                    logger.warn(`Limite audio atteinte (${AUDIO_CONFIG.MAX_INSTANCES}), suppression de ${oldestKey}`);
                }
            }
        }

        // Créer une nouvelle instance audio
        const audio = new Audio(audioPath);
        audio.volume = volume;
        audio.loop = loop;

        // Stocker l'instance
        audioState.addAudioInstance(id, audio);

        // Lire l'audio si autoplay est activé
        if (autoplay) {
            audio.play()
                .catch(error => logger.error(`Erreur lors de la lecture de l'audio ${filename}:`, error));
        }

        return audio;
    }

    /**
     * Arrêter et retirer une instance audio
     */
    stop(id: string): void {
        audioState.removeAudioInstance(id);
    }

    /**
     * Nettoyer toutes les instances audio
     */
    cleanup(): void {
        audioState.clearAllAudio();
    }

    /**
     * Obtenir le nombre d'instances actives
     */
    getActiveCount(): number {
        return audioState.activeCount;
    }
}
