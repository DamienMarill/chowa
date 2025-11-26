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
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1,
            speedY: 0,
            speedX: 0,
            speedRotationX: 0,
            speedRotationY: 0,
            speedRotationZ: 0,
            swayOffset: 0,
            swayFrequency: 1,
            swayAmplitude: 0,
            image: '',
            element: null
        };
    }

    /**
     * Réinitialiser une particule avec des valeurs aléatoires pour A-Frame
     * @param possibleZValues - Valeurs Z possibles pour les particules
     */
    resetParticle(particle: Particle, possibleZValues: number[] = [0.05, 0.15, 0.25, 0.35]): void {
        // Position initiale aléatoire dans l'espace 3D AR
        particle.x = (Math.random() * 2 - 1.5) * 1.2;
        particle.y = 1.2 + Math.random() * 0.5;
        particle.z = possibleZValues[Math.floor(Math.random() * possibleZValues.length)];

        // Rotations initiales aléatoires
        particle.rotationX = Math.random() * 360;
        particle.rotationY = Math.random() * 360;
        particle.rotationZ = Math.random() * 360;

        // Échelle aléatoire
        particle.scale = 0.01 + Math.random() * 0.09;

        // Vitesses aléatoires
        particle.speedY = 0.0005 + Math.random() * 0.0008;
        particle.speedX = 0.0002 + Math.random() * 0.0003;

        // Vitesses de rotation
        particle.speedRotationX = (Math.random() - 0.5) * 0.2;
        particle.speedRotationY = (Math.random() - 0.5) * 0.2;
        particle.speedRotationZ = (Math.random() - 0.5) * 0.2;

        // Balancement
        particle.swayFrequency = 0.2 + Math.random() * 0.4;
        particle.swayAmplitude = 0.0005 + Math.random() * 0.001;
        particle.swayOffset = Math.random() * Math.PI * 2;

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
