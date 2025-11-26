<script lang="ts">
    import 'aframe';
    import 'mind-ar/dist/mindar-image-aframe.prod.js';
    import {
        DEBUG,
        ASSET_CONFIG,
        TOTAL_PAPERS
    } from './config/constants';

    // Stores
    import { gameState } from './stores/gameState.svelte';

    // Managers
    import { AudioManager } from './audio/AudioManager';

    // Composants UI
    import PaperModal from './ui/PaperModal.svelte';
    import ScandalModal from './ui/ScandalModal.svelte';
    import CreditsModal from './ui/CreditsModal.svelte';
    import DevModal from './ui/DevModal.svelte';
    import ChowaFoundModal from './ui/ChowaFoundModal.svelte';

    // Composants systèmes
    import ParticleSystem from './components/particles/ParticleSystem.svelte';
    import HitboxSystem from './components/hitbox/HitboxSystem.svelte';

    // Composants AR
    import ARScene from './components/ar/ARScene.svelte';

    let debug = $state(DEBUG);

    // Logger conditionnel basé sur DEBUG
    const logger = {
        log: (...args: unknown[]) => debug && console.log(...args),
        warn: (...args: unknown[]) => debug && console.warn(...args),
        error: (...args: unknown[]) => console.error(...args) // Toujours logger les erreurs
    };

    let showPaperModal = $state(false);
    let showScandalModal = $state(false);
    let showCreditsModal = $state(false);
    let showDevModal = $state(false);
    let showChowaFoundModal = $state(false);

    // Référence au composant DevModal
    let devModalComponent: DevModal | undefined = $state(undefined);

    // Référence à l'entité AR pour le système de particules
    let arEntity: Element | null = null;

    // Extension de l'interface trackAsset pour inclure les handlers de clic
    interface TrackAsset {
        name: string;
        z: number;
        ratio?: number;
        clickHandler?: () => void;
    }

    let assetRatio = $state(ASSET_CONFIG.RATIO_DEFAULT);


    // Liste des images de pétales (pour les assets)
    let sakuraImages = [
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

    // Tableau d'images
    const images: TrackAsset[] = [
        { name: 'background', z: 0, ratio: 1.55 },
        { name: "pc", z: 0.2, clickHandler: () => {
            showDevModal = true;
            setTimeout(() => devModalComponent?.startAnimation(), 300);
        }},
        { name: 'bibi', z: 0.3, clickHandler: () => audioManager.play('cafe.mp3', {volume: 0.3}) },
        { name: 'whale', z: 0.3, clickHandler: () => audioManager.play('trivia.mp3')},
        { name: 'paper_2', z: 0.3, clickHandler: () => collectPaper('paper_2', 'angular')  },
        { name: 'paper_6', z: 0.3, clickHandler: () => collectPaper('paper_6', 'angular') },
        { name: 'phone', z: 0.35, clickHandler: () => showCreditsModal = true },
        { name: 'book_2', z: 0.35, clickHandler: () => tookBook()},
        { name: 'girl', z: 0.4, clickHandler: () => audioManager.play('Million-dreams.mp3') },
        { name: 'paper_8', z: 0.4, clickHandler: () => collectPaper('paper_8', 'laravel') },
        { name: 'scandal', z: 0.45, clickHandler: () => showScandalModal = true },
        { name: 'book_1', z: 0.45, clickHandler: () => tookBook()},
        { name: 'book_3', z: 0.5, clickHandler: () => tookBook()},
        { name: 'mimiqui', z: 0.5, clickHandler: () => audioManager.play('mimiqui.mp3', {volume: 0.3}) },
        { name: 'paper_1', z: 0.5, clickHandler: () => collectPaper('paper_1', 'tailwind') },
        { name: 'paper_4', z: 0.5, clickHandler: () => collectPaper('paper_4', 'tailwind')},
        { name: 'paper_7', z: 0.5, clickHandler: () => collectPaper('paper_7', 'angular') },
        { name: 'paper_3', z: 0.6, clickHandler: () => collectPaper('paper_3', 'laravel') },
        { name: 'paper_5', z: 0.6, clickHandler: () => collectPaper('paper_5', 'laravel') },
    ];

    let hasFound = false;

    function foundChowa(){
        if (!hasFound){
            showChowaFoundModal = true;
            hasFound = true;
        }
    }

    /**
     * Callback quand la scène AR est chargée
     */
    function handleSceneLoaded(entity: Element | null) {
        arEntity = entity;
    }

    function collectPaper(name: string, framework: string){
        let element = document.querySelector('.'+name);
        if (debug) {
            logger.log(element);
        }
        if (element?.getAttribute('visible')){
            element?.setAttribute('visible', 'false');
            gameState.collectPaper(framework);
            audioManager.play('paper.mp3');

            // Vérifier si on vient de compléter tous les papiers de ce framework
            const totalPapers = TOTAL_PAPERS[framework as keyof typeof TOTAL_PAPERS];
            const collectedCount = gameState.papers[framework];

            if (collectedCount === totalPapers){
                gameState.selectPaper(framework);
                showPaperModal = true;
            }
        }
    }

    function tookBook(){
        let sounds = ['book1.mp3', 'book2.mp3', 'book3.mp3'];
        let randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        audioManager.play(randomSound);
    }

    const audioManager = new AudioManager();
</script>

<main>
    <div id="scanOverlay" class="hidden">
        <div class="mindar-ui-overlay mindar-ui-scanning">
            <div class="scanning">
                <div class="inner">
                    <div class="flex items-center justify-center w-full h-full opacity-60 saturate-50">
                        <img src="/chowa_little.jpg" class="w-full"/>
                    </div>
                    <div class="scanline">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <ARScene
        {images}
        {sakuraImages}
        {assetRatio}
        onTargetFound={foundChowa}
        onSceneLoaded={handleSceneLoaded}
    />

    <!-- Systèmes -->
    <ParticleSystem bind:arEntity={arEntity} />
    <HitboxSystem {images} {assetRatio} {debug} />

    <!-- Modals -->
    <PaperModal bind:isOpen={showPaperModal} onClose={() => showPaperModal = false} />
    <ScandalModal bind:isOpen={showScandalModal} onClose={() => showScandalModal = false} />
    <CreditsModal bind:isOpen={showCreditsModal} onClose={() => showCreditsModal = false} />
    <DevModal bind:this={devModalComponent} bind:isOpen={showDevModal} onClose={() => showDevModal = false} />
    <ChowaFoundModal bind:isOpen={showChowaFoundModal} onClose={() => showChowaFoundModal = false} />
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    main {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }
    
    @keyframes appear {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
    }

    :global(.appear-animation) {
        animation: appear 0.8s cubic-bezier(0.26, 0.53, 0.74, 1.48) forwards;
    }

    :global(.mockup-code pre code) {
        white-space: pre-wrap;
        max-height: 50vh;
        overflow-y: auto;
        line-height: 1.5;
    }

    :global(.modal-box svg) {
        width: 100%;
        height: auto;
        max-height: 250px;
    }
</style>
