/**
 * Pool d'objets pour les particules
 * Évite l'allocation/désallocation répétée d'objets
 */

import { PARTICLE_CONFIG } from '../config/constants';
import type { Particle } from './types';

export class ParticlePool {
    private pool: Particle[] = [];
    private active: Set<number> = new Set();
    private nextId = 1;

    /**
     * Obtenir une particule du pool (réutilisée ou nouvelle)
     */
    acquire(): Particle {
        let particle: Particle;

        // Chercher une particule inactive dans le pool
        const inactive = this.pool.find(p => !this.active.has(p.id));

        if (inactive) {
            // Réutiliser une particule existante
            particle = inactive;
            this.resetParticle(particle);
        } else {
            // Créer une nouvelle particule
            particle = this.createParticle();
            this.pool.push(particle);
        }

        this.active.add(particle.id);
        return particle;
    }

    /**
     * Libérer une particule (la remettre dans le pool)
     */
    release(particle: Particle): void {
        this.active.delete(particle.id);
        particle.element = null; // Nettoyer la référence DOM
    }

    /**
     * Obtenir toutes les particules actives
     */
    getActive(): Particle[] {
        return this.pool.filter(p => this.active.has(p.id));
    }

    /**
     * Obtenir le nombre de particules actives
     */
    getActiveCount(): number {
        return this.active.size;
    }

    /**
     * Nettoyer toutes les particules
     */
    clear(): void {
        this.active.clear();
        this.pool.forEach(p => p.element = null);
    }

    /**
     * Créer une nouvelle particule avec des valeurs par défaut
     */
    private createParticle(): Particle {
        const id = this.nextId++;

        return {
            id,
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            opacity: 1,
            speedY: 0,
            speedX: 0,
            swayOffset: 0,
            swayFrequency: 1,
            image: '',
            element: null
        };
    }

    /**
     * Réinitialiser une particule avec des valeurs aléatoires
     */
    private resetParticle(particle: Particle): void {
        // Position initiale aléatoire
        particle.x = Math.random() * window.innerWidth;
        particle.y = -50; // Au-dessus de l'écran
        particle.z = Math.random() * 0.3; // Profondeur aléatoire

        // Échelle aléatoire
        particle.scale = PARTICLE_CONFIG.SCALE.MIN +
            Math.random() * (PARTICLE_CONFIG.SCALE.MAX - PARTICLE_CONFIG.SCALE.MIN);

        // Opacité
        particle.opacity = 1;

        // Vitesses aléatoires
        particle.speedY = PARTICLE_CONFIG.SPEED.Y.MIN +
            Math.random() * (PARTICLE_CONFIG.SPEED.Y.MAX - PARTICLE_CONFIG.SPEED.Y.MIN);
        particle.speedX = PARTICLE_CONFIG.SPEED.X.MIN +
            Math.random() * (PARTICLE_CONFIG.SPEED.X.MAX - PARTICLE_CONFIG.SPEED.X.MIN);

        // Balancement
        particle.swayOffset = Math.random() * Math.PI * 2;
        particle.swayFrequency = PARTICLE_CONFIG.SWAY.FREQUENCY_MIN +
            Math.random() * (PARTICLE_CONFIG.SWAY.FREQUENCY_MAX - PARTICLE_CONFIG.SWAY.FREQUENCY_MIN);

        // Element sera assigné plus tard
        particle.element = null;
    }

    /**
     * Initialiser le pool avec un nombre de particules
     */
    initialize(count = PARTICLE_CONFIG.COUNT): Particle[] {
        const particles: Particle[] = [];

        for (let i = 0; i < count; i++) {
            particles.push(this.acquire());
        }

        return particles;
    }
}
