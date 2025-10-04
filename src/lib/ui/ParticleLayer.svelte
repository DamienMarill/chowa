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
        '/divers/sakura1.png',
        '/divers/sakura2.png',
        '/divers/sakura3.png',
        '/divers/sakura4.png'
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

    let lastTimestamp = 0;

    function animate(timestamp: number) {
        const deltaTime = lastTimestamp ? timestamp - lastTimestamp : 16;
        lastTimestamp = timestamp;
        
        updateParticles(deltaTime);

        const animationId = requestAnimationFrame(animate);
        particleState.setAnimationFrameId(animationId);
    }

    onMount(() => {
        initParticles();
        particleState.setAnimating(true);
        requestAnimationFrame(animate);
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
