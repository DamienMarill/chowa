<script lang="ts">
    /**
     * Couche d'affichage des particules sakura
     * Utilise le store particleState pour la réactivité
     */

    import { onMount, onDestroy } from 'svelte';
    import { particleState } from '../stores/particleState.svelte';
    import { ParticlePool } from '../particles/ParticlePool';
    import { PARTICLE_CONFIG } from '../config/constants';

    const particlePool = new ParticlePool();

    // Images sakura disponibles
    const sakuraImages = [
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
        '/sakuras/sakura1.png',
        '/sakuras/sakura2.png',
        '/sakuras/sakura3.png',
        '/sakuras/sakura4.png',
        '/sakuras/sakura5.png',
        '/sakuras/sakura6.png',
        '/sakuras/sakura7.png'
    ];

    function getRandomSakuraImage(): string {
        return sakuraImages[Math.floor(Math.random() * sakuraImages.length)];
    }

    function initParticles() {
        const particles = particlePool.initialize(PARTICLE_CONFIG.COUNT);

        // Assigner des images aléatoires
        particles.forEach(particle => {
            particle.image = getRandomSakuraImage();
        });

        particleState.setParticles(particles);
    }

    function updateParticles(deltaTime: number) {
        const particles = particleState.particles;

        particles.forEach(particle => {
            // Mise à jour position Y (chute)
            particle.y += particle.speedY * deltaTime;

            // Mise à jour position X (balancement)
            particle.swayOffset += particle.swayFrequency * deltaTime * 0.001;
            particle.x += Math.sin(particle.swayOffset) * PARTICLE_CONFIG.SWAY.AMPLITUDE * deltaTime;

            // Réinitialiser si la particule est sortie de l'écran
            if (particle.y > window.innerHeight + 50) {
                particle.y = -50;
                particle.x = Math.random() * window.innerWidth;
            }
        });
    }

    function animate() {
        const deltaTime = 16; // ~60 FPS
        updateParticles(deltaTime);

        const animationId = requestAnimationFrame(animate);
        particleState.setAnimationFrameId(animationId);
    }

    onMount(() => {
        initParticles();
        particleState.setAnimating(true);
        animate();
    });

    onDestroy(() => {
        particleState.setAnimating(false);
        if (particleState.animationFrameId !== null) {
            cancelAnimationFrame(particleState.animationFrameId);
        }
        particlePool.clear();
    });
</script>

<div class="particle-container">
    {#each particleState.particles as particle (particle.id)}
        <img
            src={particle.image}
            alt="Sakura petal"
            class="particle"
            style:transform="translate3d({particle.x}px, {particle.y}px, 0) scale({particle.scale})"
            style:opacity={particle.opacity}
            style:z-index={Math.floor(particle.z * 100)}
        />
    {/each}
</div>

<style>
    .particle-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        overflow: hidden;
    }

    .particle {
        position: absolute;
        pointer-events: none;
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
    }
</style>
