<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { ParticlePool } from '../../particles/ParticlePool';
    import type { Particle } from '../../particles/types';
    import { PARTICLE_CONFIG } from '../../config/constants';

    interface Props {
        /** Container AR parent (mindar-image-target) */
        arEntity?: Element | null;
    }

    let { arEntity = $bindable(null) }: Props = $props();

    // Pool de particules
    const particlePool = new ParticlePool();

    // Liste des particules actives
    let particles = $state<Particle[]>([]);

    // Container des particules dans la scène
    let particleContainer: HTMLElement | null = null;

    // ID de l'animation
    let particleAnimationId: number | null = null;

    // Liste des images de pétales
    const sakuraImages = [
        '/sakuras/sakura1.png',
        '/sakuras/sakura2.png',
        '/sakuras/sakura3.png',
        '/sakuras/sakura4.png',
        '/sakuras/sakura5.png',
        '/sakuras/sakura6.png',
        '/sakuras/sakura7.png',
        '/sakuras/petal1.png',
        '/sakuras/petal2.png',
        '/sakuras/petal3.png',
        '/sakuras/petal4.png',
        '/sakuras/petal5.png',
        '/sakuras/petal6.png',
        '/sakuras/petal7.png',
        '/sakuras/petal8.png',
        '/sakuras/petal9.png',
        '/sakuras/petal10.png',
        '/sakuras/petal11.png',
        '/sakuras/petal12.png',
        '/sakuras/petal13.png',
        '/sakuras/petal14.png',
    ];

    // Valeurs Z possibles
    const possibleZValues = [0.05, 0.15, 0.25, 0.35];

    /**
     * Obtenir une image aléatoire
     */
    function getRandomSakuraImage(): string {
        return sakuraImages[Math.floor(Math.random() * sakuraImages.length)];
    }

    /**
     * Acquérir une particule du pool et créer son élément
     */
    function acquireParticle(): Particle {
        const particle = particlePool.acquire();
        const image = getRandomSakuraImage();

        particlePool.resetParticle(particle, possibleZValues);
        particle.image = image;

        if (particleContainer) {
            const el = document.createElement('a-plane');
            el.setAttribute('id', `particle-${particle.id}`);
            el.setAttribute('src', image);
            el.setAttribute('width', '1');
            el.setAttribute('height', '1');
            el.setAttribute('material', 'transparent: true; alphaTest: 0.5; depthTest: true; depthWrite: false;');
            el.setAttribute('scale', `${particle.scale} ${particle.scale} ${particle.scale}`);
            el.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
            el.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);

            particleContainer.appendChild(el);
            particle.element = el;
        }

        return particle;
    }

    /**
     * Libérer une particule (la retourner au pool)
     */
    function releaseParticle(particle: Particle): void {
        if (particle.element && particleContainer) {
            particleContainer.removeChild(particle.element);
        }
        particlePool.release(particle);
    }

    /**
     * Générer toutes les particules initiales
     */
    function generateParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_CONFIG.COUNT; i++) {
            const particle = acquireParticle();
            // Distribution verticale initiale
            particle.y = -1 + Math.random() * 3;
            particles.push(particle);
        }
    }

    /**
     * Mettre à jour toutes les particules
     */
    function updateParticles(deltaTime: number) {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];

            // Mouvement vertical et horizontal
            particle.y -= particle.speedY * deltaTime;
            particle.x += particle.speedX * deltaTime;

            // Balancement (oscillation horizontale)
            const swayX = Math.sin((Date.now() * 0.001 * particle.swayFrequency) + particle.swayOffset)
                * particle.swayAmplitude * deltaTime;
            particle.x += swayX;

            // Rotations
            particle.rotationX += particle.speedRotationX * deltaTime;
            particle.rotationY += particle.speedRotationY * deltaTime;
            particle.rotationZ += particle.speedRotationZ * deltaTime;

            // Recycler la particule si elle sort de l'écran
            if (particle.y < -1.5 || particle.x > 1.5) {
                releaseParticle(particle);
                const newParticle = acquireParticle();
                const newImage = getRandomSakuraImage();
                newParticle.image = newImage;
                if (newParticle.element) {
                    newParticle.element.setAttribute('src', newImage);
                }
                particles[i] = newParticle;
            }

            // Mettre à jour l'élément DOM
            if (particle.element) {
                particle.element.setAttribute('position', `${particle.x} ${particle.y} ${particle.z}`);
                particle.element.setAttribute('rotation', `${particle.rotationX} ${particle.rotationY} ${particle.rotationZ}`);
            }
        }
    }

    /**
     * Boucle d'animation
     */
    function startParticleAnimation() {
        let lastTime = performance.now();

        const animateParticles = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            updateParticles(deltaTime);
            particleAnimationId = requestAnimationFrame(animateParticles);
        };

        particleAnimationId = requestAnimationFrame(animateParticles);
    }

    /**
     * Initialiser le système de particules
     */
    function initParticleSystem() {
        if (!arEntity) {
            console.error('AR entity not found for particle system');
            return;
        }

        particleContainer = document.createElement('a-entity');
        particleContainer.setAttribute('id', 'particle-container');
        arEntity.appendChild(particleContainer);

        generateParticles();
        startParticleAnimation();
    }

    /**
     * Nettoyer le système
     */
    function cleanup() {
        // Arrêter l'animation
        if (particleAnimationId !== null) {
            cancelAnimationFrame(particleAnimationId);
        }

        // Nettoyer les particules
        particles.forEach(p => {
            if (p.element && particleContainer) {
                particleContainer.removeChild(p.element);
            }
        });

        particlePool.clear();
        particles = [];

        // Retirer le container
        if (particleContainer && particleContainer.parentNode) {
            particleContainer.parentNode.removeChild(particleContainer);
        }
    }

    // Effet réactif pour initialiser quand arEntity est disponible
    $effect(() => {
        if (arEntity && !particleContainer) {
            initParticleSystem();
        }
    });

    onDestroy(() => {
        cleanup();
    });

    // Exporter les images pour les assets
    export { sakuraImages };
</script>

<!-- Ce composant ne rend rien directement, il manipule le DOM A-Frame -->
